from datetime import date, datetime, timedelta
import re
from typing import Optional


def normalize_date(date_str: str) -> Optional[str]:
    if not date_str:
        return None
    if isinstance(date_str, (datetime, date)):
        return date_str.strftime("%Y-%m-%d")
    s = date_str.strip()
    if re.match(r"^\d{4}-\d{2}-\d{2}$", s):
        return s
    m = re.match(r"^(\d{1,2})/(\d{1,2})/(\d{4})$", s)
    if m:
        return f"{m.group(3)}-{int(m.group(2)):02d}-{int(m.group(1)):02d}"
    m = re.match(r"^(\d{1,2})-(\d{1,2})-(\d{4})$", s)
    if m:
        return f"{m.group(3)}-{int(m.group(2)):02d}-{int(m.group(1)):02d}"
    m = re.match(r"^(\d{4})/(\d{1,2})/(\d{1,2})$", s)
    if m:
        return f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
    if re.match(r"^\d{4,5}$", s):
        serial = int(s)
        dt = datetime(1899, 12, 30) + timedelta(days=serial)
        return dt.strftime("%Y-%m-%d")
    return None


def is_valid_date(date_str: str) -> bool:
    if not date_str or not re.match(r"^\d{4}-\d{2}-\d{2}$", date_str):
        return False
    try:
        y, m, d = map(int, date_str.split("-"))
        dt = date(y, m, d)
        return dt.year == y and dt.month == m and dt.day == d
    except ValueError:
        return False


def days_between_natural(inicio: str, fin: str) -> int:
    start = date.fromisoformat(inicio)
    end = date.fromisoformat(fin)
    diff = abs((end - start).days)
    return diff + 1


def days_to_commercial(natural_days: int):
    years = natural_days // 360
    remainder = natural_days % 360
    months = remainder // 30
    days = remainder % 30
    return {"years": years, "months": months, "days": days, "total": natural_days}


def days_to_natural(natural_days: int):
    years = natural_days // 365
    remainder = natural_days % 365
    months = remainder // 30
    days = remainder % 30
    return {"years": years, "months": months, "days": days, "total": natural_days}
