import { TokenStorage } from "@restorio/auth";
import type {
  BulkCreateStaffUserResponse,
  BulkCreateStaffUserResult,
  CreateStaffUserRequest,
  CreateStaffUserResponse,
  StaffInviteNotification,
} from "@restorio/types";
import { Button, FormActions, Input, Modal, Dropdown, useI18n, useToast, Loader } from "@restorio/ui";
import { isEmailValid } from "@restorio/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactElement, useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BiSolidSave } from "react-icons/bi";
import { FaCirclePlus } from "react-icons/fa6";
import { TbTrash } from "react-icons/tb";

import { api } from "../api/client";
import { useCurrentTenant } from "../context/TenantContext";
import { PageLayout } from "../layouts/PageLayout";

type AccessLevel = "kitchen" | "waiter";

interface StaffUser {
  id: string;
  email: string;
  name: string | null;
  surname: string | null;
  accessLevel: AccessLevel;
  isActive: boolean;
}

interface FormRow {
  key: number;
  email: string;
  name?: string;
  surname?: string;
  accessLevel: AccessLevel;
}

const toAccessLevel = (value: unknown): AccessLevel | null => {
  if (value === "kitchen" || value === "waiter") {
    return value;
  }

  return null;
};

const staffQueryKey = ["staff-users"] as const;

const tenantProfileQueryKey = (tenantId: string): readonly string[] => ["tenant-profile", tenantId];

const STAFF_ALREADY_MEMBER_BACKEND_DETAIL = "User already belongs to this tenant";

interface HttpErrorLike {
  response?: {
    status?: number;
    data?: unknown;
  };
}

const getHttpErrorDetail = (error: unknown): string | null => {
  if (error && typeof error === "object" && "response" in error) {
    const data = (error as HttpErrorLike).response?.data;

    if (data && typeof data === "object" && "detail" in data) {
      const { detail } = data as { detail: unknown };

      if (typeof detail === "string") {
        return detail;
      }
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return null;
};

const isStaffAlreadyMemberConflict = (error: unknown): boolean => {
  if (!error || typeof error !== "object" || !("response" in error)) {
    return false;
  }

  const status = (error as HttpErrorLike).response?.status;

  if (status !== 409) {
    return false;
  }

  return getHttpErrorDetail(error) === STAFF_ALREADY_MEMBER_BACKEND_DETAIL;
};

let nextRowKey = 0;

const createEmptyRow = (): FormRow => ({
  key: nextRowKey++,
  email: "",
  name: "",
  surname: "",
  accessLevel: "kitchen",
});

const parseUsers = (
  rawUsers: {
    id: string;
    email: string;
    name: string | null;
    surname: string | null;
    is_active: boolean;
    account_type: unknown;
  }[],
): StaffUser[] =>
  rawUsers
    .map((user): StaffUser | null => {
      const level = toAccessLevel(user.account_type);

      if (level === null) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        accessLevel: level,
        isActive: user.is_active,
      };
    })
    .filter((user): user is StaffUser => user !== null);

const normalizeStaffInviteNotification = (raw: StaffInviteNotification | undefined): StaffInviteNotification => {
  if (raw === "existing_waiter_notice" || raw === "existing_account_linked") {
    return raw;
  }

  return "activation";
};

const summarizeBulkInviteNotifications = (
  results: BulkCreateStaffUserResponse["results"],
): Set<StaffInviteNotification> =>
  new Set(
    results
      .filter((entry: BulkCreateStaffUserResult) => entry.status === "created")
      .map((entry) => normalizeStaffInviteNotification(entry.notification)),
  );

const describeBulkFullSuccess = (kinds: Set<StaffInviteNotification>, t: (key: string) => string): string => {
  if (kinds.size !== 1) {
    return t("staff.toast.bulkSuccessMixedNotificationsDescription");
  }

  const only = kinds.values().next().value!;

  if (only === "activation") {
    return t("staff.toast.bulkSuccessDescription");
  }

  if (only === "existing_waiter_notice") {
    return t("staff.toast.bulkSuccessAllWaiterNoticeDescription");
  }

  return t("staff.toast.bulkSuccessAllLinkedDescription");
};

const describeStaffSingleSuccess = (notification: StaffInviteNotification, t: (key: string) => string): string => {
  switch (notification) {
    case "activation":
      return t("staff.toast.singleSuccessDescription");
    case "existing_waiter_notice":
      return t("staff.toast.singleExistingWaiterDescription");
    case "existing_account_linked":
      return t("staff.toast.singleExistingLinkedDescription");
  }
};

export const StaffPage = (): ReactElement => {
  const { t } = useI18n();
  const { showToast } = useToast();
  const { selectedTenantId } = useCurrentTenant();
  const queryClient = useQueryClient();
  const refreshStaffUsers = useCallback(async (): Promise<void> => {
    await queryClient.refetchQueries({
      predicate: (query) => Array.isArray(query.queryKey) && query.queryKey[0] === staffQueryKey[0],
    });
  }, [queryClient]);
  const [showForm, setShowForm] = useState(false);
  const [rows, setRows] = useState<FormRow[]>(() => [createEmptyRow()]);
  const [pendingDeleteUserId, setPendingDeleteUserId] = useState<string | null>(null);
  const [deleteConfirmPos, setDeleteConfirmPos] = useState<{ top: number; left: number } | null>(null);
  const deleteButtonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [formError, setFormError] = useState<string | null>(null);
  const [savingRowKey, setSavingRowKey] = useState<number | null>(null);
  const [isAlreadyMemberModalOpen, setIsAlreadyMemberModalOpen] = useState(false);

  const currentUserEmail = useMemo((): string | null => {
    const token = TokenStorage.getAccessToken();

    if (!token) {
      return null;
    }

    const decoded = TokenStorage.decodeToken(token);

    return decoded?.email ?? null;
  }, []);

  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: [...staffQueryKey, selectedTenantId ?? ""],
    queryFn: async () => {
      if (!selectedTenantId) {
        return [];
      }

      const raw = await api.users.list(selectedTenantId);

      return parseUsers(raw);
    },
    enabled: selectedTenantId !== null,
  });

  const { data: tenantProfile } = useQuery({
    queryKey: tenantProfileQueryKey(selectedTenantId ?? ""),
    queryFn: () => api.tenantProfiles.get(selectedTenantId!),
    enabled: selectedTenantId !== null,
  });

  const accessOptions = useMemo(
    () => [
      { value: "kitchen", label: t("staff.accessLevels.kitchen") },
      { value: "waiter", label: t("staff.accessLevels.waiter") },
    ],
    [t],
  );

  const resetForm = useCallback((): void => {
    setRows([createEmptyRow()]);
    setShowForm(false);
  }, []);

  const bulkMutation = useMutation<BulkCreateStaffUserResponse, Error, { users: CreateStaffUserRequest[] }>({
    mutationFn: async (payload) => {
      if (!selectedTenantId) {
        throw new Error("No tenant selected");
      }

      const result: BulkCreateStaffUserResponse = await api.users.bulkCreate(selectedTenantId, payload);

      return result;
    },
    onSuccess: async (response) => {
      await refreshStaffUsers();
      resetForm();

      const created = response.results.filter((r) => r.status === "created").length;

      const total = response.results.length;

      if (created === total) {
        const kinds = summarizeBulkInviteNotifications(response.results);
        const description = describeBulkFullSuccess(kinds, t);

        showToast("success", t("staff.toast.bulkSuccessTitle"), description);
      } else {
        showToast(
          "warning",
          t("staff.toast.bulkPartialTitle"),
          t("staff.toast.bulkPartialDescription", { created: String(created), total: String(total) }),
        );
      }
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error && error.message.trim() !== "" ? error.message : t("staff.toast.bulkErrorDescription");

      showToast("error", t("staff.toast.bulkErrorTitle"), message);
    },
  });

  const singleCreateMutation = useMutation<CreateStaffUserResponse, Error, CreateStaffUserRequest>({
    mutationFn: (payload: CreateStaffUserRequest) => {
      if (!selectedTenantId) {
        throw new Error("No tenant selected");
      }

      return api.users.create(selectedTenantId, payload);
    },
    onSuccess: async (response) => {
      await refreshStaffUsers();

      if (savingRowKey !== null) {
        removeRow(savingRowKey);
      }

      setSavingRowKey(null);
      const notification = normalizeStaffInviteNotification(response.data.notification);

      showToast("success", t("staff.toast.singleSuccessTitle"), describeStaffSingleSuccess(notification, t));
    },
    onError: (error: unknown) => {
      setSavingRowKey(null);

      if (isStaffAlreadyMemberConflict(error)) {
        setIsAlreadyMemberModalOpen(true);

        return;
      }

      const message =
        error instanceof Error && error.message.trim() !== "" ? error.message : t("staff.toast.singleErrorDescription");

      showToast("error", t("staff.toast.singleErrorTitle"), message);
    },
  });

  const handleSaveSingle = (row: FormRow): void => {
    setFormError(null);

    const isWaiter = row.accessLevel === "waiter";
    const normalizedName = row.name?.trim() ?? "";
    const normalizedSurname = row.surname?.trim() ?? "";

    if (!isEmailValid(row.email)) {
      setFormError(t("staff.validation.invalidEmail"));

      return;
    }

    if (isWaiter && (normalizedName.length === 0 || normalizedSurname.length === 0)) {
      setFormError(t("staff.validation.waiterNameRequired"));

      return;
    }

    const trimmed = row.email.trim();

    if (blockedEmails.has(trimmed.toLowerCase())) {
      setFormError(t("staff.validation.existingEmail", { emails: trimmed }));

      return;
    }

    setSavingRowKey(row.key);
    singleCreateMutation.mutate({
      email: trimmed,
      access_level: row.accessLevel,
      ...(isWaiter ? { name: normalizedName, surname: normalizedSurname } : {}),
    });
  };

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => {
      if (!selectedTenantId) {
        throw new Error("No tenant selected");
      }

      return api.users.delete(selectedTenantId, userId);
    },
    onSuccess: async () => {
      await refreshStaffUsers();
      setPendingDeleteUserId(null);
      showToast("success", t("staff.toast.deleteSuccessTitle"), t("staff.toast.deleteSuccessDescription"));
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error && error.message.trim() !== "" ? error.message : t("staff.toast.deleteErrorDescription");

      showToast("error", t("staff.toast.deleteErrorTitle"), message);
    },
  });

  const updateRow = (key: number, field: keyof Omit<FormRow, "key">, value: string): void => {
    setRows((current) =>
      current.map((row) => {
        if (row.key !== key) {
          return row;
        }

        if (field === "accessLevel") {
          const level = toAccessLevel(value);

          if (level !== null) {
            const updates: Partial<FormRow> = { accessLevel: level };

            if (level === "kitchen") {
              updates.name = "";
              updates.surname = "";
            }

            return { ...row, ...updates };
          }

          return row;
        }

        return { ...row, [field]: value };
      }),
    );
  };

  const removeRow = (key: number): void => {
    setRows((current) => {
      const next = current.filter((row) => row.key !== key);

      return next.length === 0 ? [createEmptyRow()] : next;
    });
  };

  const handleTrashClick = (key: number): void => {
    if (rows.length === 1 && rows[0].email.trim() === "") {
      resetForm();

      return;
    }

    removeRow(key);
  };

  const addRow = (): void => {
    setRows((current) => [...current, createEmptyRow()]);
  };

  const isFormValid =
    rows.length > 0 &&
    rows.every((row) => {
      const isWaiter = row.accessLevel === "waiter";
      const hasValidEmail = isEmailValid(row.email);

      if (!isWaiter) {
        return hasValidEmail;
      }

      const normalizedName = row.name?.trim() ?? "";
      const normalizedSurname = row.surname?.trim() ?? "";

      return hasValidEmail && normalizedName.length > 0 && normalizedSurname.length > 0;
    });

  const blockedEmails = useMemo((): Set<string> => {
    const set = new Set<string>();

    for (const u of users) {
      set.add(u.email.toLowerCase());
    }

    if (currentUserEmail) {
      set.add(currentUserEmail.toLowerCase());
    }

    const owner = tenantProfile?.ownerEmail?.trim();

    if (owner) {
      set.add(owner.toLowerCase());
    }

    return set;
  }, [users, currentUserEmail, tenantProfile?.ownerEmail]);

  const hasDuplicateEmails = (): boolean => {
    const emails = rows.map((r) => r.email.trim().toLowerCase());

    return new Set(emails).size !== emails.length;
  };

  const getExistingConflicts = (emails: string[]): string[] => emails.filter((e) => blockedEmails.has(e.toLowerCase()));

  const handleSubmit = (): void => {
    setFormError(null);

    if (!selectedTenantId) {
      return;
    }

    if (!isFormValid) {
      setFormError(t("staff.validation.invalidEmail"));

      return;
    }

    if (hasDuplicateEmails()) {
      setFormError(t("staff.validation.duplicateEmail"));

      return;
    }

    const trimmedEmails = rows.map((r) => r.email.trim());
    const conflicts = getExistingConflicts(trimmedEmails);

    if (conflicts.length > 0) {
      setFormError(t("staff.validation.existingEmail", { emails: conflicts.join(", ") }));

      return;
    }

    const payload = rows.map((row) => {
      const isWaiter = row.accessLevel === "waiter";

      return {
        email: row.email.trim(),
        access_level: row.accessLevel,
        ...(isWaiter
          ? {
              name: row.name?.trim() ?? "",
              surname: row.surname?.trim() ?? "",
            }
          : {}),
      };
    });

    bulkMutation.mutate({ users: payload });
  };

  const handleDeleteUser = (userId: string): void => {
    if (deleteMutation.isPending) {
      return;
    }

    setFormError(null);
    deleteMutation.mutate(userId);
  };

  const openForm = (): void => {
    setRows([createEmptyRow()]);
    setShowForm(true);
  };

  const registerDeleteButton =
    (userId: string) =>
    (el: HTMLButtonElement | null): void => {
      if (el) {
        deleteButtonRefs.current.set(userId, el);
      } else {
        deleteButtonRefs.current.delete(userId);
      }
    };

  useLayoutEffect(() => {
    if (pendingDeleteUserId === null) {
      setDeleteConfirmPos(null);

      return;
    }

    const updatePosition = (): void => {
      const btn = deleteButtonRefs.current.get(pendingDeleteUserId);

      if (!btn) {
        return;
      }

      const r = btn.getBoundingClientRect();
      const panelW = 256;
      const margin = 8;
      const left = Math.min(Math.max(margin, r.right - panelW), window.innerWidth - panelW - margin);
      const top = r.bottom + margin;

      setDeleteConfirmPos({ top, left });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [pendingDeleteUserId]);

  const hasUsers = !isLoadingUsers && users.length > 0;
  const showEmptyState = !isLoadingUsers && users.length === 0;
  const showFormCard = showForm;

  const headerActions = ((): ReactElement | undefined => {
    if (showForm) {
      return (
        <FormActions>
          <Button type="button" disabled={!isFormValid || bulkMutation.isPending} onClick={handleSubmit}>
            {bulkMutation.isPending ? t("staff.form.submitting") : t("staff.form.submit")}
          </Button>
        </FormActions>
      );
    }

    if (showEmptyState || hasUsers) {
      return (
        <FormActions>
          <Button type="button" onClick={openForm}>
            {t("staff.toggleForm.show")}
          </Button>
        </FormActions>
      );
    }

    return undefined;
  })();

  return (
    <PageLayout title={t("staff.title")} description={t("staff.description")} headerActions={headerActions}>
      <div className="relative min-w-0 w-full space-y-4 p-6">
        {isLoadingUsers && (
          <div className="flex items-center gap-2 text-sm text-text-tertiary">
            <Loader size="sm" />
            <span>{t("staff.list.loading")}</span>
          </div>
        )}

        {showEmptyState && !showForm && (
          <h1 className="text-2xl mt-4 font-semibold text-center text-text-primary">{t("staff.emptyState.heading")}</h1>
        )}

        {showFormCard && (
          <div className="overflow-hidden rounded-lg border border-border-default bg-surface-secondary p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="secondary" onClick={resetForm}>
                {t("staff.toggleForm.hide")}
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {rows.map((row) => (
                <div key={row.key} className="flex flex-col md:flex-row items-end gap-3">
                  <div className="flex-1 w-full md:w-auto">
                    <Input
                      label={t("staff.form.emailLabel")}
                      type="email"
                      autoComplete="email"
                      value={row.email}
                      onChange={(event) => updateRow(row.key, "email", event.target.value)}
                      required
                    />
                  </div>

                  {row.accessLevel === "waiter" && (
                    <>
                      <div className="flex-1 w-full md:w-auto">
                        <Input
                          label={t("staff.form.nameLabel")}
                          value={row.name ?? ""}
                          maxLength={50}
                          onChange={(event) => updateRow(row.key, "name", event.target.value)}
                          required
                        />
                      </div>
                      <div className="flex-1 w-full md:w-auto">
                        <Input
                          label={t("staff.form.surnameLabel")}
                          value={row.surname ?? ""}
                          maxLength={50}
                          onChange={(event) => updateRow(row.key, "surname", event.target.value)}
                          required
                        />
                      </div>
                    </>
                  )}

                  <div className="w-full md:w-48 shrink-0">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-text-primary">{t("staff.form.accessLabel")}</label>
                      <Dropdown
                        trigger={
                          <Button variant="outline" className="w-full justify-between font-normal">
                            {accessOptions.find((opt) => opt.value === row.accessLevel)?.label}
                          </Button>
                        }
                        placement="bottom-start"
                        className="w-full md:w-48"
                        closeOnSelect
                      >
                        <div className="flex flex-col p-1">
                          {accessOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              className="w-full md:w-12 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-surface-secondary"
                              onClick={() => updateRow(row.key, "accessLevel", option.value)}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </Dropdown>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-3 w-full md:w-auto justify-end">
                    <Button
                      type="button"
                      size="icon"
                      variant="primary"
                      disabled={
                        !isEmailValid(row.email) ||
                        (row.accessLevel === "waiter" && (!row.name?.trim() || !row.surname?.trim())) ||
                        singleCreateMutation.isPending ||
                        bulkMutation.isPending
                      }
                      onClick={() => handleSaveSingle(row)}
                      aria-label={t("staff.form.saveSingle")}
                      className="h-11 w-11 min-h-11 min-w-11"
                    >
                      <BiSolidSave className="size-6" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="danger"
                      onClick={() => handleTrashClick(row.key)}
                      aria-label={t("staff.form.removeRow")}
                      className="h-11 w-11 min-h-11 min-w-11"
                    >
                      <TbTrash className="size-6" aria-hidden />
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={addRow}
                aria-label={t("staff.form.addRow")}
                className="h-11 w-11 min-h-11 min-w-11 shrink-0"
              >
                <FaCirclePlus className="size-6" aria-hidden />
              </Button>
            </div>

            {formError && (
              <div className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">
                {formError}
              </div>
            )}
          </div>
        )}

        {hasUsers && (
          <div className="relative min-w-0 rounded-lg border border-border-default">
            <div className="rounded-t-lg border-b border-border-default px-6 py-4 text-sm font-medium text-text-secondary">
              {t("staff.list.title")}
            </div>
            <div className="rounded-b-lg px-6 pb-1 pt-0">
              <ul className="m-0 list-none divide-y divide-border-default p-0">
                {users.map((user) => (
                  <li key={user.id} className="flex min-w-0 items-center justify-between gap-3 py-4">
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="truncate text-sm text-text-primary">{user.email}</span>
                      {user.accessLevel === "waiter" && (
                        <span className="text-xs text-text-secondary truncate">
                          {t("staff.list.personLabel", {
                            name: user.name ?? t("staff.list.notProvided"),
                            surname: user.surname ?? t("staff.list.notProvided"),
                          })}
                        </span>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span
                        className={`text-xs font-medium ${
                          user.isActive ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        {user.isActive ? t("staff.status.active") : t("staff.status.inactive")}
                      </span>
                      <span className="text-xs uppercase tracking-wide text-text-tertiary">
                        {t(`staff.accessLevels.${user.accessLevel}`)}
                      </span>
                      <Button
                        ref={registerDeleteButton(user.id)}
                        type="button"
                        size="sm"
                        variant="danger"
                        className="shadow-none"
                        disabled={deleteMutation.isPending && deleteMutation.variables === user.id}
                        onClick={() => {
                          setPendingDeleteUserId((current) => (current === user.id ? null : user.id));
                        }}
                      >
                        {deleteMutation.isPending && deleteMutation.variables === user.id
                          ? t("staff.delete.deleting")
                          : t("staff.delete.button")}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {pendingDeleteUserId !== null &&
          deleteConfirmPos !== null &&
          typeof document !== "undefined" &&
          createPortal(
            <>
              <div className="fixed inset-0 z-[90]" aria-hidden onClick={() => setPendingDeleteUserId(null)} />
              <div
                className="fixed z-[100] w-64 rounded-md border border-border-default bg-surface-primary p-3 shadow-lg"
                style={{ top: deleteConfirmPos.top, left: deleteConfirmPos.left }}
                role="dialog"
                aria-modal="true"
              >
                <p className="text-xs text-text-secondary">{t("staff.delete.confirmTitle")}</p>
                <div className="mt-3 flex justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setPendingDeleteUserId(null);
                    }}
                  >
                    {t("staff.delete.cancel")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    disabled={deleteMutation.isPending && deleteMutation.variables === pendingDeleteUserId}
                    onClick={() => handleDeleteUser(pendingDeleteUserId)}
                  >
                    {t("staff.delete.confirm")}
                  </Button>
                </div>
              </div>
            </>,
            document.body,
          )}

        <Modal
          isOpen={isAlreadyMemberModalOpen}
          onClose={() => {
            setIsAlreadyMemberModalOpen(false);
          }}
          title={t("staff.modal.alreadyMemberTitle")}
          size="sm"
          className="border-2 border-status-warning-border"
          closeButtonAriaLabel={t("staff.modal.closeAria")}
        >
          <p className="text-sm text-text-secondary">{t("staff.modal.alreadyMemberDescription")}</p>
          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              variant="primary"
              onClick={() => {
                setIsAlreadyMemberModalOpen(false);
              }}
            >
              {t("staff.modal.ok")}
            </Button>
          </div>
        </Modal>
      </div>
    </PageLayout>
  );
};
