import Card from '../components/ui/Card';

export default function UnauthorizedPage({ path }) {
  return (
    <Card className="max-w-3xl">
      <p className="text-xs uppercase tracking-[0.35em] text-amber-300">Access restricted</p>
      <h2 className="mt-3 text-3xl font-bold text-white">You do not have permission for this area.</h2>
      <p className="mt-3 text-sm text-slate-300">
        The route <span className="font-semibold text-white">{path}</span> is protected by the current role-based
        access rules. You can continue with the modules available in the sidebar, or log in with a higher-privilege
        account.
      </p>
    </Card>
  );
}
