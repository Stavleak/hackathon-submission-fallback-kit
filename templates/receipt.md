# Submission receipt / Квитанция сдачи

| Field / Поле | Value / Значение |
|---|---|
| Receipt ID / Номер квитанции | [ID] |
| Event / Событие | [event reference] |
| Team / Команда | [team reference; avoid unnecessary personal data / без лишних личных данных] |
| Received at / Получено | [ISO 8601 + named zone] |
| Deadline / Дедлайн | [published ISO 8601 + rules version] |
| Channel / Канал | [primary / fallback] |
| Incident / Инцидент | [reference or not applicable] |
| Fixed version / Фиксированная версия | [commit or archive identifier] |
| Materials / Материалы | [names, sizes, SHA-256] |
| Receipt issuer / Кто выдал | [authorized role + staff reference] |
| Status / Статус | [received; eligibility pending / получено; допуск ожидает проверки] |
| Reconciled at / Сверено | [separate later import time / отдельное время импорта] |

Received is a receipt status. Eligibility and judging are separate decisions.

«Получено» является статусом квитанции. Допуск и конкурсная оценка требуют отдельных решений.
