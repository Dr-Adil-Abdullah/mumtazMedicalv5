import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { db } from '../db/index';
import { hashPin } from '../utils/crypto';
import { EMERGENCY_KEYS } from '../constants/defaults';
import { ROLES } from '../constants/roles';
import { validatePin } from '../utils/pinValidator';
import { writeLog } from '../db/logs';

function buildSessionUser(record, overrides = {}) {
  return {
    id: record.id,
    staff_id: record.staff_id,
    name: record.name,
    role: record.role,
    short_code: record.short_code,
    isEmergency: false,
    ...overrides
  };
}

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      async login({ staffId, pin }) {
        const normalized = staffId.trim().toUpperCase();
        const record = await db.staff.where('staff_id').equals(normalized).first();

        if (!record || !record.is_active) {
          await writeLog({
            action: 'FAILED_LOGIN',
            user_name: normalized || 'Unknown',
            details: { reason: 'staff_not_found_or_inactive' }
          });
          throw new Error('Staff ID not found or account is inactive.');
        }

        const pinHash = await hashPin(pin);

        if (pinHash !== record.pin_hash) {
          await writeLog({
            action: 'FAILED_LOGIN',
            user_name: record.name,
            details: { reason: 'wrong_pin' }
          });
          throw new Error('Incorrect PIN.');
        }

        const user = buildSessionUser(record, {
          mustChangePin: !!record.must_change_pin
        });

        await writeLog({
          action: 'LOGIN',
          user_id: record.id,
          user_name: record.name,
          details: { role: record.role }
        });

        set({ user });
        return user;
      },
      async emergencyLogin({ name, key }) {
        const trimmedKey = key.trim();
        const settings = await db.settings.get(1);

        const keyMap = {
          [settings?.super_key_1 ?? EMERGENCY_KEYS.super_admin]: ROLES.SUPER_ADMIN,
          [settings?.super_key_2 ?? EMERGENCY_KEYS.manager]: ROLES.MANAGER,
          [settings?.super_key_3 ?? EMERGENCY_KEYS.salesperson]: ROLES.SALESPERSON
        };

        const role = keyMap[trimmedKey];

        if (!role) {
          await writeLog({
            action: 'FAILED_EMERGENCY_LOGIN',
            user_name: name || 'Emergency User',
            details: { reason: 'invalid_key' }
          });
          throw new Error('Emergency key is invalid.');
        }

        const user = {
          id: crypto.randomUUID(),
          staff_id: 'EMERGENCY',
          name: name || 'Emergency Access',
          role,
          short_code: role === ROLES.SUPER_ADMIN ? 'SA' : role === ROLES.MANAGER ? 'MG' : 'SP',
          isEmergency: true,
          mustChangePin: false
        };

        await writeLog({
          action: 'EMERGENCY_LOGIN',
          user_id: user.id,
          user_name: user.name,
          details: { role: user.role }
        });

        set({ user });
        return user;
      },
      async updateOwnPin({ currentPin = '', newPin, confirmPin, skipCurrentPin = false }) {
        const currentUser = useAuthStore.getState().user;

        if (!currentUser || currentUser.isEmergency) {
          throw new Error('Emergency sessions cannot change a local user PIN.');
        }

        if (newPin !== confirmPin) {
          throw new Error('PIN confirmation does not match.');
        }

        const validationError = validatePin(newPin);
        if (validationError) {
          throw new Error(validationError);
        }

        const record = await db.staff.get(currentUser.id);
        if (!record) {
          throw new Error('Staff account could not be found.');
        }

        if (!skipCurrentPin) {
          const currentPinHash = await hashPin(currentPin);
          if (currentPinHash !== record.pin_hash) {
            throw new Error('Current PIN is incorrect.');
          }
        }

        const nextHash = await hashPin(newPin);
        if (nextHash === record.pin_hash) {
          throw new Error('New PIN must be different from the old one.');
        }

        const updated = {
          ...record,
          pin_hash: nextHash,
          must_change_pin: false,
          updated_at: new Date().toISOString()
        };

        await db.staff.put(updated);
        await writeLog({
          action: 'PIN_CHANGE',
          user_id: updated.id,
          user_name: updated.name,
          details: {
            forced_reset_completed: !!record.must_change_pin,
            via: skipCurrentPin ? 'forced_change' : 'self_service'
          }
        });

        set({
          user: {
            ...currentUser,
            mustChangePin: false
          }
        });
      },
      async logout() {
        const snapshot = useAuthStore.getState().user;

        if (snapshot) {
          await writeLog({
            action: 'LOGOUT',
            user_id: snapshot.id,
            user_name: snapshot.name,
            details: { role: snapshot.role }
          });
        }

        set({ user: null });
      }
    }),
    {
      name: 'mumtaz-medical-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ user: state.user })
    }
  )
);
