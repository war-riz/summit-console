"use client";

import * as React from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Ban, CircleCheck, KeyRound, MoreHorizontal, Pencil, Plus, ShieldOff, Trash2, UserPlus, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownContent, DropdownItem, DropdownMenu, DropdownSeparator, DropdownTrigger } from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableWrap, Td, Th, Tr } from "@/components/ui/table";
import { useMe } from "@/hooks/use-me";
import { useConfirm } from "@/providers/confirm-provider";
import { ApiError, api } from "@/lib/api/client";
import type { AdminUser, Role } from "@/lib/api/types";
import { qk } from "@/lib/query-keys";
import { formatDate, formatDateTime, timeAgo } from "@/lib/format";

const ROLES: { value: Role; label: string; help: string }[] = [
  { value: "viewer", label: "Viewer", help: "Read-only access to applications and email status." },
  { value: "gate_staff", label: "Gate staff", help: "Event-day volunteer: can only scan entry passes and check people in." },
  { value: "admin", label: "Admin", help: "Can also decide, add notes, export CSV, retry emails and view the audit log." },
  { value: "super_admin", label: "Super admin", help: "Everything an admin can do, plus manage administrators." },
];
const roleTone = { super_admin: "navy", admin: "info", viewer: "neutral", gate_staff: "warning" } as const;
const schema = z.object({ name: z.string().min(2, "Enter the full name"), email: z.string().email("Enter a valid email address"), role: z.enum(["viewer", "gate_staff", "admin", "super_admin"]) });
type Form = z.infer<typeof schema>;

export function AdministratorsPage() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { data: me } = useMe();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: qk.admins, queryFn: () => api.get<AdminUser[]>("/admin/users"), retry: false });
  const [dialog, setDialog] = React.useState<{ mode: "create" } | { mode: "edit"; user: AdminUser } | null>(null);
  const refresh = () => qc.invalidateQueries({ queryKey: qk.admins });

  const run = async (label: string, fn: () => Promise<unknown>) => {
    try { await fn(); toast.success(label); refresh(); } catch (e) { toast.error((e as ApiError).message); }
  };

  const toggleActive = async (u: AdminUser) => {
    const { confirmed } = await confirm({
      title: `${u.is_active ? "Deactivate" : "Reactivate"} ${u.name}?`, tone: u.is_active ? "danger" : "success",
      description: u.is_active ? "They are signed out everywhere and can no longer sign in." : "They will be able to sign in again.", confirmLabel: u.is_active ? "Deactivate" : "Reactivate"
    });
    if (confirmed) run(u.is_active ? "Administrator deactivated" : "Administrator reactivated", () => api.patch(`/admin/users/${u.id}`, { is_active: !u.is_active }));
  };
  const remove = async (u: AdminUser) => {
    const { confirmed } = await confirm({
      title: `Delete ${u.name} permanently?`, tone: "danger", confirmLabel: "Delete permanently",
      description: "Their account, sessions and notifications are removed. Audit history is kept. To only block sign-in, use Deactivate instead.",
      requireText: { label: `Type ${u.email} to confirm`, expected: u.email },
    });
    if (confirmed) run("Administrator deleted", () => api.delete(`/admin/users/${u.id}`));
  };
  const reset2fa = async (u: AdminUser) => {
    const { confirmed } = await confirm({ title: `Reset two-factor for ${u.name}?`, tone: "warning", description: "Use this when they lost their phone and have no backup codes. They are signed out and set up 2FA again at their next sign-in.", confirmLabel: "Reset 2FA" });
    if (confirmed) run("Two-factor authentication reset", () => api.post(`/admin/users/${u.id}/reset-2fa`));
  };
  const issuePassword = async (u: AdminUser) => {
    const { confirmed } = await confirm({ title: `Send ${u.name} a new temporary password?`, tone: "warning", description: `A one-time password is emailed to ${u.email}. Their sessions are ended and any lockout is cleared.`, confirmLabel: "Send new password" });
    if (confirmed) run("New temporary password emailed", () => api.post(`/admin/users/${u.id}/issue-password`));
  };

  if (error) {
    const e = error as ApiError;
    return <>
      <PageHeader title="Administrators" />
      {e.code === "MFA_SETUP_REQUIRED"
        ? <Banner tone="warning" title="Turn on two-factor authentication to manage administrators" action={<Button asChild><Link href="/security?setup=1">Set up 2FA</Link></Button>}>Administrator management stays locked until your own account is protected.</Banner>
        : <Banner tone="danger" title="Couldn't load administrators" action={<Button variant="outline" onClick={() => refetch()}>Retry</Button>}>{e.message}</Banner>}
    </>;
  }

  return (
    <>
      <PageHeader title="Administrators" description="People who can sign in to this console. There is no public sign-up: new admins receive a temporary password by email."
        actions={<Button onClick={() => setDialog({ mode: "create" })}><Plus className="size-4" />Add administrator</Button>} />
      <Card>
        {isLoading ? <div className="space-y-2 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          : !data?.length ? <EmptyState icon={<Users />} title="No administrators" />
            : <TableWrap><Table>
              <thead><tr><Th>Administrator</Th><Th>Role</Th><Th>Status</Th><Th>Two-factor</Th><Th>Last sign-in</Th><Th className="w-10"><span className="sr-only">Actions</span></Th></tr></thead>
              <tbody>{data.map((u) => (
                <Tr key={u.id}>
                  <Td><div className="flex items-center gap-3"><Avatar name={u.name} /><div className="min-w-0"><p className="truncate font-medium">{u.name}{u.id === me?.id && <span className="ml-2 text-xs font-normal text-muted-foreground">(you)</span>}</p><p className="truncate text-xs text-muted-foreground">{u.email}</p></div></div></Td>
                  <Td><Badge tone={roleTone[u.role]}>{u.role.replace("_", " ")}</Badge></Td>
                  <Td>{u.is_active ? <Badge tone="success" dot>Active</Badge> : <Badge tone="neutral" dot>Inactive</Badge>}{u.must_change_password && <p className="mt-1 text-[11px] text-warning">Temporary password</p>}</Td>
                  <Td>{u.mfa_enabled ? <Badge tone="success"><CircleCheck className="size-3" />Enabled</Badge> : <><Badge tone="warning"><ShieldOff className="size-3" />Not set up</Badge>{u.mfa_required_by && <p className="mt-1 text-[11px] text-muted-foreground">Required by {formatDate(u.mfa_required_by)}</p>}</>}</Td>
                  <Td className="whitespace-nowrap text-[13px] text-muted-foreground" title={formatDateTime(u.last_login_at)}>{u.last_login_at ? timeAgo(u.last_login_at) : "Never"}</Td>
                  <Td>
                    <DropdownMenu><DropdownTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`Actions for ${u.name}`}><MoreHorizontal className="size-4" /></Button></DropdownTrigger>
                      <DropdownContent>
                        <DropdownItem onSelect={() => setDialog({ mode: "edit", user: u })}><Pencil />Edit name or role</DropdownItem>
                        {u.id !== me?.id && <>
                          <DropdownItem onSelect={() => issuePassword(u)}><KeyRound />Send new password</DropdownItem>
                          <DropdownItem onSelect={() => reset2fa(u)} disabled={!u.mfa_enabled}><ShieldOff />Reset 2FA</DropdownItem>
                          <DropdownSeparator />
                          <DropdownItem danger={u.is_active} onSelect={() => toggleActive(u)}>{u.is_active ? <Ban /> : <CircleCheck />}{u.is_active ? "Deactivate" : "Reactivate"}</DropdownItem>
                          <DropdownItem danger onSelect={() => remove(u)}><Trash2 />Delete permanently</DropdownItem>
                        </>}
                      </DropdownContent></DropdownMenu>
                  </Td>
                </Tr>))}</tbody>
            </Table></TableWrap>}
      </Card>
      <AdminDialog state={dialog} onClose={() => setDialog(null)} onSaved={refresh} />
    </>
  );
}

function AdminDialog({ state, onClose, onSaved }: { state: { mode: "create" } | { mode: "edit"; user: AdminUser } | null; onClose: () => void; onSaved: () => void }) {
  const edit = state?.mode === "edit" ? state.user : null;
  const { register, handleSubmit, reset, control, setError, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { name: "", email: "", role: "admin" } });
  const create = useMutation({ mutationFn: (v: Form) => api.post<AdminUser>("/admin/users", v) });
  const update = useMutation({ mutationFn: (v: Partial<Form>) => api.patch<AdminUser>(`/admin/users/${edit?.id}`, v) });
  React.useEffect(() => { if (state) reset(edit ? { name: edit.name, email: edit.email, role: edit.role } : { name: "", email: "", role: "admin" }); }, [state, edit, reset]);
  const role = useWatch({ control, name: "role" });
  const busy = create.isPending || update.isPending;

  const submit = handleSubmit(async (v) => {
    try {
      if (edit) { await update.mutateAsync({ name: v.name, role: v.role }); toast.success("Administrator updated"); }
      else { await create.mutateAsync(v); toast.success("Administrator added", { description: `A temporary password was emailed to ${v.email}.` }); }
      onSaved(); onClose();
    } catch (e) {
      const err = e as ApiError;
      if (err.status === 409 && !edit) setError("email", { message: err.message }); else toast.error(err.message);
    }
  });

  return (
    <Modal open={!!state} onOpenChange={(o) => !o && !busy && onClose()} title={edit ? "Edit administrator" : "Add administrator"} icon={<UserPlus />}
      description={edit ? edit.email : "They'll receive a one-time password by email and set their own at first sign-in."}
      footer={<><Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button><Button onClick={submit} loading={busy}>{edit ? "Save changes" : "Add and send email"}</Button></>}>
      <form onSubmit={submit} className="space-y-4 pb-2" noValidate>
        <Field label="Full name" htmlFor="a-name" error={errors.name?.message} required><Input id="a-name" autoFocus {...register("name")} invalid={!!errors.name} /></Field>
        {!edit && <Field label="Work email" htmlFor="a-email" error={errors.email?.message} required><Input id="a-email" type="email" {...register("email")} invalid={!!errors.email} /></Field>}
        <Field label="Role" htmlFor="a-role" hint={ROLES.find((r) => r.value === role)?.help}><Select id="a-role" {...register("role")}>{ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}</Select></Field>
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  );
}
