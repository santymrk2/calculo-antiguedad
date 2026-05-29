from datetime import date, timedelta, datetime
from typing import Optional

from legajo.dates import days_between_natural, days_to_commercial


def merge_intervals(periods):
    if not periods:
        return []
    sorted_p = sorted(periods, key=lambda p: p["inicio"])
    merged = [dict(sorted_p[0])]
    for p in sorted_p[1:]:
        last = merged[-1]
        if p["inicio"] <= last["fin"]:
            if p["fin"] > last["fin"]:
                last["fin"] = p["fin"]
        else:
            merged.append(dict(p))
    return merged


def add_days(date_str, days):
    dt = date.fromisoformat(date_str)
    dt += timedelta(days=days)
    return dt.isoformat()


def subtract_intervals(intervals, subtractions):
    result = []
    for interval in intervals:
        parts = [{"inicio": interval["inicio"], "fin": interval["fin"]}]
        for sub in subtractions:
            new_parts = []
            for part in parts:
                if sub["fin"] < part["inicio"] or sub["inicio"] > part["fin"]:
                    new_parts.append(part)
                    continue
                if sub["inicio"] > part["inicio"]:
                    new_parts.append({"inicio": part["inicio"], "fin": add_days(sub["inicio"], -1)})
                if sub["fin"] < part["fin"]:
                    new_parts.append({"inicio": add_days(sub["fin"], 1), "fin": part["fin"]})
            parts = new_parts
        result.extend(parts)
    return result


def calculate_bruto(periods, converter=days_to_commercial):
    total = sum(days_between_natural(p["inicio"], p["fin"]) for p in periods)
    return converter(total)


def calculate_neto(periods, licencias=None, converter=days_to_commercial, descontar_licencias=True):
    if licencias is None:
        licencias = []
    merged = merge_intervals(periods)
    intervals = subtract_intervals(merged, licencias) if descontar_licencias else merged
    return calculate_bruto(intervals, converter)


def calculate_by_role(periods, converter=days_to_commercial):
    by_role = {}
    for p in periods:
        key = p.get("situacion_revista") or "SIN ESPECIFICAR"
        if key not in by_role:
            by_role[key] = []
        by_role[key].append(p)
    return {role: calculate_bruto(role_periods, converter) for role, role_periods in by_role.items()}


def create_normalized_record(dni, inicio, fin, cargo, origen, situacion_revista):
    return {
        "dni": dni.replace(".", ""),
        "inicio": inicio,
        "fin": fin,
        "cargo": cargo.strip(),
        "situacion_revista": (situacion_revista or "").upper(),
        "origen": origen,
    }


def is_duplicate(record, legajo):
    return any(
        item["dni"] == record["dni"]
        and item["inicio"] == record["inicio"]
        and item["fin"] == record["fin"]
        and item["cargo"] == record["cargo"]
        and item["situacion_revista"] == record["situacion_revista"]
        for item in legajo
    )
