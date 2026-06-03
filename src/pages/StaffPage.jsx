import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import SectionIntro from '../components/shared/SectionIntro';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import BarcodeCard from '../components/shared/BarcodeCard';
import WhatsAppButton from '../components/shared/WhatsAppButton';
import { db } from '../db/index';
import { enqueueSync } from '../db/queue';
import { writeLog } from '../db/logs';
import usePermissions from '../hooks/usePermissions';
import {
  ROLE_BADGE_STYLES,
  ROLE_LABELS,
  ROLES,
  canManageStaffRole,
  getAssignableRoles
} from '../constants/roles';
import { printBarcodeLabel } from '../utils/barcode';
import { buildStaffMessage } from '../utils/whatsapp';
import { hashPin } from '../utils/crypto';
import { validatePin } from '../utils/pinValidator';
import { buildStaffShortCode, generateStaffId, normalizeStaffId } from '../utils/staff';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function defaultForm(staffRows, actorRole) {
  const assignableRoles = getAssignableRoles(actorRole);
  const fallbackRole = assignableRoles.includes(ROLES.MANAGER)
    ? ROLES.MANAGER
    : assignableRoles[0] ?? ROLES.SALESPERSON;

  return {
    id: null,
    name: '',
    role: fallbackRole,
    phone: '',
    staff_id: generateStaffId(staffRows ?? []),
    short_code: '',
    pin: '',
    confirmPin: ''
  };
}

function sanitizeShortCode(value = '') {
  return String(value).replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 4);
}

function getChangedFields(previousRecord, nextRecord) {
  return Object.keys(nextRecord).filter((key) => previousRecord[key] !== nextRecord[key]);
}

function roleOptionsFor(actorRole, currentRole) {
  const assignable = getAssignableRoles(actorRole);
  const set = new Set(assignable);
  if (currentRole) set.add(currentRole);
  return Array.from(set);
}

export default function StaffPage() {
  const { user, role } = usePermissions();
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [detailView, setDetailView] = useState('');
  const [formMode, setFormMode] = useState('create');
  const [formOpen, setFormOpen] = useState(false);
  const [formState, setFormState] = useState(defaultForm([], role));
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPin, setResetPin] = useState('');
  const [resetConfirmPin, setResetConfirmPin] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const settings = useLiveQuery(() => db.settings.get(1), []);

  const staff = useLiveQuery(async () => {
    const rows = await db.staff.toArray();
    return rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, []);

  const staffRows = staff ?? [];
  const assignableRoles = useMemo(() => getAssignableRoles(role), [role]);
  const roleOptions = useMemo(
    () => roleOptionsFor(role, formMode === 'edit' ? formState.role : null),
    [role, formMode, formState.role]
  );

  const staffGroups = useMemo(() => {
    return {
      all: staffRows,
      active: staffRows.filter((member) => member.is_active),
      inactive: staffRows.filter((member) => !member.is_active),
      protected: staffRows.filter((member) => [ROLES.SUPER_ADMIN, ROLES.OWNER].includes(member.role)),
      resetPending: staffRows.filter((member) => member.must_change_pin)
    };
  }, [staffRows]);

  function updateFormField(key, value) {
    setFormState((current) => ({ ...current, [key]: value }));
  }

  function handleNameChange(value) {
    setFormState((current) => {
      const previousAutoCode = sanitizeShortCode(current.short_code) === buildStaffShortCode(current.name);
      const nextShortCode = !current.short_code || previousAutoCode ? buildStaffShortCode(value) : current.short_code;
      return {
        ...current,
        name: value,
        short_code: sanitizeShortCode(nextShortCode)
      };
    });
  }

  function closeFormModal() {
    setFormOpen(false);
    setFormError('');
    setFormLoading(false);
  }

  function openCreateModal() {
    setFormMode('create');
    setFormState(defaultForm(staffRows, role));
    setFormError('');
    setNotice(null);
    setFormOpen(true);
  }

  function openEditModal(member) {
    setFormMode('edit');
    setFormState({
      id: member.id,
      name: member.name,
      role: member.role,
      phone: member.phone ?? '',
      staff_id: member.staff_id,
      short_code: member.short_code ?? '',
      pin: '',
      confirmPin: ''
    });
    setFormError('');
    setNotice(null);
    setFormOpen(true);
  }

  function closeResetModal() {
    setResetTarget(null);
    setResetPin('');
    setResetConfirmPin('');
    setResetError('');
    setResetLoading(false);
  }

  function validateCreateOrEdit() {
    const trimmedName = formState.name.trim();
    const normalizedStaffId = normalizeStaffId(formState.staff_id);
    const shortCode = sanitizeShortCode(formState.short_code || buildStaffShortCode(trimmedName));

    if (!trimmedName) {
      return { error: 'Staff name is required.' };
    }

    if (!normalizedStaffId) {
      return { error: 'Staff ID is required.' };
    }

    if (normalizedStaffId.length < 4) {
      return { error: 'Staff ID must be at least 4 characters.' };
    }

    if (!shortCode || shortCode.length < 2) {
      return { error: 'Short code must be at least 2 letters or digits.' };
    }

    if (!roleOptions.includes(formState.role)) {
      return { error: 'You are not allowed to use this role.' };
    }

    const duplicateStaffId = staffRows.find(
      (member) => member.staff_id === normalizedStaffId && member.id !== formState.id
    );
    if (duplicateStaffId) {
      return { error: 'This Staff ID already exists.' };
    }

    const duplicateShortCode = staffRows.find(
      (member) => sanitizeShortCode(member.short_code) === shortCode && member.id !== formState.id
    );
    if (duplicateShortCode) {
      return { error: 'This short code is already used by another staff member.' };
    }

    if (formMode === 'create') {
      if (!canManageStaffRole(role, formState.role, 'create')) {
        return { error: 'You are not allowed to create this role.' };
      }

      if (formState.pin !== formState.confirmPin) {
        return { error: 'PIN confirmation does not match.' };
      }

      const pinError = validatePin(formState.pin);
      if (pinError) {
        return { error: pinError };
      }
    }

    if (formMode === 'edit') {
      const existingRecord = staffRows.find((member) => member.id === formState.id);
      if (!existingRecord) {
        return { error: 'Staff record could not be found.' };
      }

      if (existingRecord.id === user?.id) {
        return { error: 'Use the header PIN tools for your own account instead of editing yourself here.' };
      }

      if (!canManageStaffRole(role, existingRecord.role, 'edit')) {
        return { error: 'You are not allowed to edit this staff member.' };
      }

      if (existingRecord.role === ROLES.SUPER_ADMIN && formState.role !== ROLES.SUPER_ADMIN) {
        return { error: 'Protected super admin accounts cannot be demoted from this screen.' };
      }

      if (!canManageStaffRole(role, formState.role, 'edit')) {
        return { error: 'You are not allowed to change this staff member to the selected role.' };
      }
    }

    return {
      payload: {
        trimmedName,
        normalizedStaffId,
        shortCode
      }
    };
  }

  async function handleFormSubmit(event) {
    event.preventDefault();
    if (formLoading) return;

    setFormError('');
    setNotice(null);
    setFormLoading(true);

    try {
      const validation = validateCreateOrEdit();
      if (validation.error) {
        throw new Error(validation.error);
      }

      const { trimmedName, normalizedStaffId, shortCode } = validation.payload;
      const now = new Date().toISOString();

      if (formMode === 'create') {
        const record = {
          id: crypto.randomUUID(),
          staff_id: normalizedStaffId,
          name: trimmedName,
          role: formState.role,
          phone: formState.phone.trim(),
          short_code: shortCode,
          pin_hash: await hashPin(formState.pin),
          is_active: true,
          created_at: now,
          updated_at: now,
          must_change_pin: true
        };

        await db.transaction('rw', db.staff, db.logs, db.sync_queue, async () => {
          await db.staff.add(record);
          await enqueueSync({ tableName: 'staff', action: 'INSERT', recordId: record.id, data: record });
          await writeLog({
            action: 'STAFF_CREATE',
            user_id: user?.id,
            user_name: user?.name ?? 'Unknown user',
            details: {
              target_id: record.id,
              target_staff_id: record.staff_id,
              target_name: record.name,
              target_role: record.role,
              must_change_pin: true,
              method: 'staff_management_ui'
            }
          });
        });

        setNotice({ type: 'success', text: `${record.name} created successfully. They will be forced to change their PIN on first login.` });
        closeFormModal();
        return;
      }

      const existingRecord = staffRows.find((member) => member.id === formState.id);
      if (!existingRecord) {
        throw new Error('Staff record could not be found.');
      }

      const updated = {
        ...existingRecord,
        name: trimmedName,
        role: formState.role,
        phone: formState.phone.trim(),
        staff_id: normalizedStaffId,
        short_code: shortCode,
        updated_at: now
      };

      const changedFields = getChangedFields(existingRecord, updated);
      if (!changedFields.length) {
        setNotice({ type: 'info', text: 'No staff changes were detected.' });
        closeFormModal();
        return;
      }

      await db.transaction('rw', db.staff, db.logs, db.sync_queue, async () => {
        await db.staff.put(updated);
        await enqueueSync({ tableName: 'staff', action: 'UPDATE', recordId: updated.id, data: updated });
        await writeLog({
          action: 'STAFF_UPDATE',
          user_id: user?.id,
          user_name: user?.name ?? 'Unknown user',
          details: {
            target_id: updated.id,
            target_staff_id: updated.staff_id,
            target_name: updated.name,
            target_role: updated.role,
            changed_fields: changedFields,
            method: 'staff_management_ui'
          }
        });
      });

      setNotice({ type: 'success', text: `${updated.name} updated successfully.` });
      closeFormModal();
    } catch (error) {
      setFormError(error.message || 'Staff record could not be saved.');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleToggleActive(member) {
    setNotice(null);

    if (member.id === user?.id) {
      setNotice({ type: 'error', text: 'You cannot deactivate or reactivate your own account from this page.' });
      return;
    }

    if (!canManageStaffRole(role, member.role, 'toggle')) {
      setNotice({ type: 'error', text: `You are not allowed to change the active status for ${member.name}.` });
      return;
    }

    const nextStatus = !member.is_active;
    const shouldContinue = window.confirm(
      `${nextStatus ? 'Reactivate' : 'Deactivate'} ${member.name} (${member.staff_id})?`
    );

    if (!shouldContinue) return;

    const updated = {
      ...member,
      is_active: nextStatus,
      updated_at: new Date().toISOString()
    };

    try {
      await db.transaction('rw', db.staff, db.logs, db.sync_queue, async () => {
        await db.staff.put(updated);
        await enqueueSync({ tableName: 'staff', action: 'UPDATE', recordId: updated.id, data: updated });
        await writeLog({
          action: nextStatus ? 'STAFF_REACTIVATE' : 'STAFF_DEACTIVATE',
          user_id: user?.id,
          user_name: user?.name ?? 'Unknown user',
          details: {
            target_id: updated.id,
            target_staff_id: updated.staff_id,
            target_name: updated.name,
            target_role: updated.role,
            method: 'staff_management_ui'
          }
        });
      });

      setNotice({
        type: 'success',
        text: `${member.name} is now ${nextStatus ? 'active' : 'inactive'}.`
      });
    } catch (error) {
      setNotice({ type: 'error', text: error.message || 'Staff status could not be updated.' });
    }
  }

  async function handleResetSubmit(event) {
    event.preventDefault();
    if (!resetTarget || resetLoading) return;

    setResetError('');
    setNotice(null);
    setResetLoading(true);

    try {
      if (resetTarget.id === user?.id) {
        throw new Error('Use the header Change PIN action for your own account.');
      }

      if (!canManageStaffRole(role, resetTarget.role, 'resetPin')) {
        throw new Error('You are not allowed to reset this staff PIN.');
      }

      if (resetPin !== resetConfirmPin) {
        throw new Error('PIN confirmation does not match.');
      }

      const pinError = validatePin(resetPin);
      if (pinError) {
        throw new Error(pinError);
      }

      const nextHash = await hashPin(resetPin);
      if (nextHash === resetTarget.pin_hash) {
        throw new Error('New PIN must be different from the existing PIN.');
      }

      const updated = {
        ...resetTarget,
        pin_hash: nextHash,
        must_change_pin: true,
        updated_at: new Date().toISOString()
      };

      await db.transaction('rw', db.staff, db.logs, db.sync_queue, async () => {
        await db.staff.put(updated);
        await enqueueSync({ tableName: 'staff', action: 'UPDATE', recordId: updated.id, data: updated });
        await writeLog({
          action: 'PIN_RESET',
          user_id: user?.id,
          user_name: user?.name ?? 'Unknown user',
          details: {
            target_id: updated.id,
            target_staff_id: updated.staff_id,
            target_name: updated.name,
            target_role: updated.role,
            must_change_pin: true,
            method: 'owner_super_admin_reset'
          }
        });
      });

      setNotice({
        type: 'success',
        text: `PIN reset successfully for ${updated.name}. They must change it on next login.`
      });
      closeResetModal();
    } catch (error) {
      setResetError(error.message || 'PIN reset failed.');
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <SectionIntro
        eyebrow="Staff & IDs"
        title="Staff CRUD, role control, barcode cards, and PIN workflows"
        description="Create and update staff accounts, protect higher roles, reset PINs with forced change on next login, and keep every action logged for traceability."
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-white/10 bg-slate-950/40 px-5 py-4">
        <div className="text-sm text-slate-300">
          {role === ROLES.SUPER_ADMIN
            ? 'Super Admin can create all roles, reset any PIN, and reactivate Owner/Manager/Salesperson accounts. Super Admin accounts remain protected from deactivation.'
            : 'Owner can manage Manager and Salesperson accounts here. Use the emergency super key when higher-level recovery is needed.'}
        </div>
        <Button onClick={openCreateModal} disabled={!assignableRoles.length}>
          Add staff
        </Button>
      </div>

      {notice ? (
        <div
          className={`rounded-3xl border px-4 py-3 text-sm ${
            notice.type === 'success'
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-100'
              : notice.type === 'error'
                ? 'border-rose-500/20 bg-rose-500/10 text-rose-100'
                : 'border-sky-500/20 bg-sky-500/10 text-sky-100'
          }`}
        >
          {notice.text}
        </div>
      ) : null}

      <div className="card-grid">
        <StatCard
          label="All staff"
          value={staffGroups.all.length}
          hint="Open a clean list of all staff"
          tone="default"
          icon="👥"
          onClick={() => setDetailView('all')}
        />
        <StatCard
          label="Active"
          value={staffGroups.active.length}
          hint="Currently allowed to log in"
          tone="success"
          icon="✅"
          onClick={() => setDetailView('active')}
        />
        <StatCard
          label="PIN reset pending"
          value={staffGroups.resetPending.length}
          hint="Must change PIN on next login"
          tone="warning"
          icon="🔐"
          onClick={() => setDetailView('resetPending')}
        />
        <StatCard
          label="Protected roles"
          value={staffGroups.protected.length}
          hint="Owner + super admin accounts"
          tone="danger"
          icon="🛡️"
          onClick={() => setDetailView('protected')}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {staffRows.map((member) => {
          const canEdit = member.id !== user?.id && canManageStaffRole(role, member.role, 'edit');
          const canToggle = member.id !== user?.id && canManageStaffRole(role, member.role, 'toggle');
          const canReset = member.id !== user?.id && canManageStaffRole(role, member.role, 'resetPin');

          return (
            <Card key={member.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold text-white">{member.name}</h3>
                  <p className="mt-1 text-sm text-slate-400">{member.staff_id}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className={ROLE_BADGE_STYLES[member.role]}>{ROLE_LABELS[member.role]}</Badge>
                  <Badge className={member.is_active ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-rose-500/30 bg-rose-500/10 text-rose-200'}>
                    {member.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  {member.must_change_pin ? (
                    <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-100">PIN change pending</Badge>
                  ) : null}
                  {member.id === user?.id ? <Badge className="border-white/10 bg-white/5 text-slate-100">You</Badge> : null}
                  {member.role === ROLES.SUPER_ADMIN ? (
                    <Badge className="border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-200">Protected</Badge>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="detail-item">
                  <div className="text-slate-500">Short code</div>
                  <div className="mt-1 font-semibold text-white">{member.short_code ?? '—'}</div>
                </div>
                <div className="detail-item">
                  <div className="text-slate-500">Phone</div>
                  <div className="mt-1 font-semibold text-white">{member.phone || '—'}</div>
                </div>
                <div className="detail-item">
                  <div className="text-slate-500">Created</div>
                  <div className="mt-1 font-semibold text-white">{formatDate(member.created_at)}</div>
                </div>
                <div className="detail-item">
                  <div className="text-slate-500">Updated</div>
                  <div className="mt-1 font-semibold text-white">{formatDate(member.updated_at)}</div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  onClick={() => openEditModal(member)}
                  disabled={!canEdit}
                  title={canEdit ? 'Edit staff account' : member.id === user?.id ? 'Edit your own account from other pages only' : 'You are not allowed to edit this role'}
                >
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setResetTarget(member);
                    setResetPin('');
                    setResetConfirmPin('');
                    setResetError('');
                    setNotice(null);
                  }}
                  disabled={!canReset}
                  title={canReset ? 'Reset PIN and force change on next login' : member.id === user?.id ? 'Use the header Change PIN action for yourself' : 'You are not allowed to reset this role PIN'}
                >
                  Reset PIN
                </Button>
                <Button variant="secondary" onClick={() => setSelectedStaff(member)}>
                  Preview barcode
                </Button>
                <Button
                  onClick={() =>
                    printBarcodeLabel({
                      title: member.name,
                      subtitle: `${ROLE_LABELS[member.role]} • ${member.staff_id}`,
                      code: member.staff_id,
                      note: 'Scan this code in scanner-ready inputs.'
                    })
                  }
                >
                  Print barcode
                </Button>
                <WhatsAppButton
                  phone={member.phone}
                  message={buildStaffMessage({
                    shopName: settings?.shop_name || 'Mumtaz Medical',
                    staffName: member.name,
                    roleLabel: ROLE_LABELS[member.role]
                  })}
                  label="WhatsApp staff"
                />
                <Button
                  variant={member.is_active ? 'danger' : 'primary'}
                  onClick={() => handleToggleActive(member)}
                  disabled={!canToggle}
                  title={canToggle ? `${member.is_active ? 'Deactivate' : 'Reactivate'} this staff member` : member.id === user?.id ? 'You cannot change your own active state here' : 'This role is protected from status changes'}
                >
                  {member.is_active ? 'Deactivate' : 'Reactivate'}
                </Button>
              </div>
            </Card>
          );
        })}

        {!staffRows.length ? (
          <Card>
            <h3 className="text-lg font-semibold text-white">No staff found</h3>
            <p className="mt-2 text-sm text-slate-400">Initialize the app first to seed the owner account.</p>
          </Card>
        ) : null}
      </div>

      <Modal open={!!selectedStaff} onClose={() => setSelectedStaff(null)} title="Staff barcode" size="sm">
        {selectedStaff ? (
          <div className="space-y-4">
            <div className="flex justify-end gap-3">
              <WhatsAppButton
                phone={selectedStaff.phone}
                message={buildStaffMessage({
                  shopName: settings?.shop_name || 'Mumtaz Medical',
                  staffName: selectedStaff.name,
                  roleLabel: ROLE_LABELS[selectedStaff.role]
                })}
                label="WhatsApp"
              />
              <Button
                onClick={() =>
                  printBarcodeLabel({
                    title: selectedStaff.name,
                    subtitle: `${ROLE_LABELS[selectedStaff.role]} • ${selectedStaff.staff_id}`,
                    code: selectedStaff.staff_id,
                    note: 'Scan this code in scanner-ready inputs.'
                  })
                }
              >
                Print
              </Button>
            </div>
            <BarcodeCard
              title={selectedStaff.name}
              subtitle={`${ROLE_LABELS[selectedStaff.role]} • ${selectedStaff.staff_id}`}
              code={selectedStaff.staff_id}
              note="Use this staff ID barcode for quick scanning workflows."
            />
          </div>
        ) : null}
      </Modal>

      <Modal open={formOpen} onClose={closeFormModal} title={formMode === 'create' ? 'Add staff member' : 'Edit staff member'} size="lg">
        <form className="space-y-4" onSubmit={handleFormSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input label="Full name" value={formState.name} onChange={(event) => handleNameChange(event.target.value)} placeholder="e.g. Ahmad Khan" />

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-300">Role</span>
              <select
                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/30"
                value={formState.role}
                onChange={(event) => updateFormField('role', event.target.value)}
              >
                {roleOptions.map((roleValue) => (
                  <option key={roleValue} value={roleValue}>
                    {ROLE_LABELS[roleValue]}
                  </option>
                ))}
              </select>
            </label>

            <Input
              label="Staff ID"
              value={formState.staff_id}
              onChange={(event) => updateFormField('staff_id', normalizeStaffId(event.target.value))}
              placeholder="STAFF-002"
            />
            <Input
              label="Short code"
              value={formState.short_code}
              onChange={(event) => updateFormField('short_code', sanitizeShortCode(event.target.value))}
              placeholder="AK"
            />
            <Input label="Phone" value={formState.phone} onChange={(event) => updateFormField('phone', event.target.value)} placeholder="03xx-xxxxxxx" />
          </div>

          {formMode === 'create' ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Temporary PIN"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={formState.pin}
                onChange={(event) => updateFormField('pin', event.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
              />
              <Input
                label="Confirm temporary PIN"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={formState.confirmPin}
                onChange={(event) => updateFormField('confirmPin', event.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-100">
              PIN changes are handled separately through the <span className="font-semibold">Reset PIN</span> action so the
              account can be forced to choose a new secret PIN on next login.
            </div>
          )}

          {formError ? <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-100">{formError}</div> : null}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={formLoading}>
              {formLoading ? 'Saving...' : formMode === 'create' ? 'Create staff' : 'Save changes'}
            </Button>
            <Button type="button" variant="secondary" onClick={closeFormModal}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!resetTarget} onClose={closeResetModal} title="Reset staff PIN" size="sm">
        {resetTarget ? (
          <form className="space-y-4" onSubmit={handleResetSubmit}>
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-300">
              Reset the PIN for <span className="font-semibold text-white">{resetTarget.name}</span> ({resetTarget.staff_id}).
              The new temporary PIN will be logged and the user will be required to change it on next login.
            </div>

            <Input
              label="New temporary PIN"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={resetPin}
              onChange={(event) => setResetPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
            />
            <Input
              label="Confirm temporary PIN"
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={resetConfirmPin}
              onChange={(event) => setResetConfirmPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
            />

            {resetError ? <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-sm text-rose-100">{resetError}</div> : null}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={resetLoading || resetPin.length !== 4 || resetConfirmPin.length !== 4}>
                {resetLoading ? 'Resetting...' : 'Reset PIN'}
              </Button>
              <Button type="button" variant="secondary" onClick={closeResetModal}>
                Cancel
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>

      <Modal open={!!detailView} onClose={() => setDetailView('')} title="Staff summary details" size="lg">
        <div className="space-y-4">
          {(staffGroups[detailView] ?? []).map((member) => (
            <div key={member.id} className="detail-item">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-white">{member.name}</div>
                  <div className="mt-1 text-xs text-slate-400">
                    {member.staff_id} • {ROLE_LABELS[member.role]} • {member.phone || 'No phone'}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className={member.is_active ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-rose-500/30 bg-rose-500/10 text-rose-200'}>
                    {member.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  {member.must_change_pin ? (
                    <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-100">PIN change pending</Badge>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
          {!(staffGroups[detailView] ?? []).length ? <div className="detail-item text-slate-400">No staff records for this selection.</div> : null}
        </div>
      </Modal>
    </div>
  );
}
