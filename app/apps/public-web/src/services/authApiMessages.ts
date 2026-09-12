type Translator = (key: string) => string;

export const translateLoginApiMessage = (message: string | undefined, t: Translator): string | undefined => {
  if (message == null || message.trim().length === 0) {
    return undefined;
  }

  switch (message) {
    case "Invalid credentials":
      return t("login.errors.invalidCredentials");
    case "Account is not active":
      return t("login.errors.accountNotActive");
    default:
      return message;
  }
};

export const translateRegisterApiMessage = (message: string | undefined, t: Translator): string | undefined => {
  if (message == null || message.trim().length === 0) {
    return undefined;
  }

  switch (message) {
    case "Email already registered":
      return t("errors.emailAlreadyRegistered");
    default:
      return message;
  }
};
