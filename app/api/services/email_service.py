from __future__ import annotations

import asyncio
import html

import resend

from core.foundation.infra.config import settings


class EmailService:
    def __init__(self) -> None:
        self._resend_api_key = settings.RESEND_API_KEY.strip()
        self._resend_from_email = settings.RESEND_FROM_EMAIL.strip()

    def _get_resend_settings(self) -> tuple[str, str]:
        if not self._resend_api_key:
            msg = "RESEND_API_KEY is required to send emails."
            raise RuntimeError(msg)
        if not self._resend_from_email:
            msg = "RESEND_FROM_EMAIL is required to send emails."
            raise RuntimeError(msg)
        return self._resend_api_key, self._resend_from_email

    async def send_activation_email(
        self,
        to_email: str,
        activation_link: str,
        restaurant_name: str | None = None,
    ) -> None:
        resend_api_key, resend_from_email = self._get_resend_settings()
        resend.api_key = resend_api_key

        if restaurant_name:
            subject = f"Aktywuj konto dla restauracji {restaurant_name}"
            greeting = "Witamy w Restorio!"
            html = f"""
            <p>{greeting}</p>
            <p>Aktywuj swoje konto dla restauracji {restaurant_name}, klikając w poniższy link:</p>
            <p><a href="{activation_link}">Link aktywacyjny</a></p>
            <p>Jeśli nie tworzyłeś konta w naszym serwisie, proszę zignorować tę wiadomość.</p>
            """

        else:
            subject = "Aktywuj swoje konto Restorio"
            greeting = "Witamy w Restorio!"
            html = f"""
            <p>{greeting}</p>
            <p>Aktywuj swoje konto, klikając w poniższy link:</p>
            <p><a href="{activation_link}">Link aktywacyjny</a></p>
            <p>Jeśli nie tworzyłeś konta w naszym serwisie, proszę zignorować tę wiadomość.</p>
            """

        await asyncio.to_thread(
            resend.Emails.send,
            {
                "from": resend_from_email,
                "to": [to_email],
                "subject": subject,
                "html": html,
            },
        )

    async def send_password_reset_email(self, *, to_email: str, reset_link: str) -> None:
        resend_api_key, resend_from_email = self._get_resend_settings()
        resend.api_key = resend_api_key

        subject = "Resetowanie hasła w Restorio"
        safe_link = html.escape(reset_link.strip(), quote=True)
        html_body = f"""
            <p>Witamy w Restorio!</p>
            <p>Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta.</p>
            <p><a href="{safe_link}">Ustaw nowe hasło</a></p>
            <p>Link jest ważny przez jedną godzinę. Jeśli to nie Ty, zignoruj tę wiadomość.</p>
            """

        await asyncio.to_thread(
            resend.Emails.send,
            {
                "from": resend_from_email,
                "to": [to_email],
                "subject": subject,
                "html": html_body,
            },
        )

    async def send_waiter_added_existing_account_email(
        self,
        *,
        to_email: str,
        restaurant_name: str,
        waiter_panel_url: str,
    ) -> None:
        resend_api_key, resend_from_email = self._get_resend_settings()
        resend.api_key = resend_api_key

        safe_name = html.escape(restaurant_name, quote=True)
        safe_url = html.escape(waiter_panel_url.strip(), quote=True)
        subject_name = restaurant_name.replace("\r", " ").replace("\n", " ").strip()
        subject_name = subject_name.replace("<", "").replace(">", "")

        subject = f"Dodano Cię do restauracji {subject_name}"
        html_body = f"""
            <p>Witamy w Restorio!</p>
            <p>Twoje konto zostało przypisane do restauracji <strong>{safe_name}</strong>.</p>
            <p>
              Przy kolejnym logowaniu do panelu kelnera możesz wybrać tę restaurację na liście dostępnych lokali.
            </p>
            <p><a href="{safe_url}">Przejdź do panelu kelnera</a></p>
            <p>W razie pytań skontaktuj się z administratorem restauracji.</p>
            """

        await asyncio.to_thread(
            resend.Emails.send,
            {
                "from": resend_from_email,
                "to": [to_email],
                "subject": subject,
                "html": html_body,
            },
        )
