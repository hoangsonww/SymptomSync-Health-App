"""Deterministic decision-support helpers for MCP tools.

These helpers are intentionally rule-based and model-independent so they work
even when external LLM providers are unavailable.
"""

from __future__ import annotations

import re
from typing import Any

URGENCY_RANK = {
    "low": 0,
    "medium": 1,
    "high": 2,
    "emergency": 3,
}

RED_FLAG_PATTERNS: dict[str, tuple[str, ...]] = {
    "chest pain": ("chest pain", "pressure in chest", "crushing chest pain"),
    "difficulty breathing": ("shortness of breath", "trouble breathing", "can't breathe"),
    "stroke-like symptoms": (
        "face drooping",
        "slurred speech",
        "one-sided weakness",
        "numbness one side",
    ),
    "severe bleeding": ("severe bleeding", "won't stop bleeding", "blood everywhere"),
    "loss of consciousness": ("passed out", "unconscious", "fainted and not waking"),
    "seizure activity": ("seizure", "convulsion"),
    "suicidal ideation": ("suicidal", "want to die", "harm myself"),
}

RISK_CONDITION_WEIGHTS: dict[str, int] = {
    "pregnancy": 8,
    "heart disease": 12,
    "copd": 10,
    "diabetes": 6,
    "immunocompromised": 12,
    "cancer": 10,
    "kidney disease": 8,
    "asthma": 6,
}

SYMPTOM_HINTS: dict[str, tuple[str, ...]] = {
    "fever": ("fever", "temperature", "chills"),
    "headache": ("headache", "migraine", "head pain"),
    "dizziness": ("dizzy", "lightheaded", "vertigo"),
    "nausea": ("nausea", "queasy"),
    "vomiting": ("vomit", "throwing up"),
    "diarrhea": ("diarrhea", "loose stool"),
    "sore throat": ("sore throat", "throat pain"),
    "cough": ("cough", "coughing"),
    "fatigue": ("fatigue", "tired", "exhausted"),
    "rash": ("rash", "hives", "skin breakout"),
    "abdominal pain": ("abdominal pain", "stomach pain", "belly pain"),
}

SELF_CARE_LIBRARY: dict[str, list[str]] = {
    "fever": ["Stay hydrated with water or oral rehydration fluids.", "Rest and monitor temperature trends."],
    "headache": ["Rest in a quiet, dark room.", "Limit screen exposure and hydrate."],
    "dizziness": ["Avoid sudden position changes.", "Sit or lie down until symptoms settle."],
    "nausea": ["Eat small, bland meals.", "Sip fluids frequently to avoid dehydration."],
    "vomiting": ["Use small fluid sips every few minutes.", "Pause solid foods until vomiting improves."],
    "diarrhea": ["Increase fluids and electrolytes.", "Avoid high-fat or very spicy foods temporarily."],
    "sore throat": ["Use warm fluids and throat lozenges if tolerated.", "Avoid smoke and other irritants."],
    "cough": ["Use humidified air and hydration.", "Avoid exertion while symptoms are active."],
    "fatigue": ["Prioritize sleep and reduced workload.", "Resume activity gradually."],
    "rash": ["Avoid new irritants or products.", "Track spread, itching, and swelling."],
    "abdominal pain": ["Use a bland diet and hydration.", "Avoid alcohol and heavy meals until improved."],
}

GENERAL_MONITORING = [
    "Track symptom severity (0-10) every 4-6 hours.",
    "Seek care if symptoms worsen or do not improve within 24-48 hours.",
    "Escalate immediately for any red-flag symptom.",
]

SEEK_CARE_THRESHOLDS = {
    "low": "Primary care or telehealth if symptoms persist.",
    "medium": "Same-day or next-day clinical review is recommended.",
    "high": "Urgent care or emergency department evaluation today.",
    "emergency": "Call emergency services now.",
}

URGENCY_EXPLANATIONS = {
    "low": "Current pattern appears mild without immediate danger signs.",
    "medium": "Symptoms may need prompt medical review to avoid progression.",
    "high": "Risk profile is elevated and should be assessed urgently.",
    "emergency": "Potentially life-threatening warning signs are present.",
}

EMAIL_PATTERN = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
PHONE_PATTERN = re.compile(r"\b(?:\+1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?){2}\d{4}\b")
SSN_PATTERN = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
DOB_PATTERN = re.compile(r"\b(?:19|20)\d{2}[-/](?:0?[1-9]|1[0-2])[-/](?:0?[1-9]|[12]\d|3[01])\b")
MRN_PATTERN = re.compile(r"\b(?:mrn|medical record number)[:\s#-]*[A-Za-z0-9-]{4,}\b", re.IGNORECASE)


def _lower(text: str) -> str:
    return text.lower().strip()


def _contains_any(text: str, phrases: tuple[str, ...]) -> bool:
    return any(phrase in text for phrase in phrases)


def detect_red_flags(user_input: str) -> list[str]:
    """Detect high-risk symptom phrases from free text."""
    normalized = _lower(user_input)
    return [flag for flag, patterns in RED_FLAG_PATTERNS.items() if _contains_any(normalized, patterns)]


def infer_symptoms(user_input: str) -> list[str]:
    """Infer normalized symptom names using keyword hints."""
    normalized = _lower(user_input)
    symptoms = [symptom for symptom, patterns in SYMPTOM_HINTS.items() if _contains_any(normalized, patterns)]
    return sorted(set(symptoms))


def _escalate_level(level: str) -> str:
    rank = URGENCY_RANK.get(level, 0)
    escalated_rank = min(rank + 1, URGENCY_RANK["emergency"])
    for candidate, candidate_rank in URGENCY_RANK.items():
        if candidate_rank == escalated_rank:
            return candidate
    return level


def suggest_urgency(
    red_flags: list[str],
    severity_hint: int | None = None,
    known_conditions: list[str] | None = None,
) -> tuple[str, list[str]]:
    """Suggest urgency level using deterministic rules."""
    reasons: list[str] = []
    severity = max(0, min(10, severity_hint or 0))
    conditions = [c.lower() for c in (known_conditions or [])]

    if red_flags:
        reasons.append("Red-flag symptoms detected in free text.")
        return "emergency", reasons

    if severity >= 8:
        reasons.append("Severity hint is very high (>=8/10).")
        urgency = "high"
    elif severity >= 5:
        reasons.append("Severity hint indicates moderate burden (5-7/10).")
        urgency = "medium"
    else:
        reasons.append("No severe indicators from severity input.")
        urgency = "low"

    elevated_risk_conditions = {"pregnancy", "heart disease", "copd", "diabetes", "immunocompromised", "cancer"}
    if any(condition in elevated_risk_conditions for condition in conditions):
        urgency = _escalate_level(urgency)
        reasons.append("Known high-risk condition present; urgency escalated.")

    return urgency, reasons


def build_clarification_questions(
    user_input: str,
    age: int | None = None,
    gender: str | None = None,
    medical_history: list[str] | None = None,
    current_medications: list[str] | None = None,
    allergies: list[str] | None = None,
) -> tuple[list[str], list[str], list[str]]:
    """Generate clarification questions for missing triage context."""
    questions: list[str] = []
    missing_fields: list[str] = []
    inferred = infer_symptoms(user_input)
    red_flags = detect_red_flags(user_input)

    if not inferred:
        questions.append("Can you describe the main symptom(s) in one sentence?")
    else:
        questions.append(f"When did these symptoms start: {', '.join(inferred)}?")
        questions.append("How severe are these symptoms on a 0-10 scale?")

    if not re.search(r"\b(hour|hours|day|days|week|weeks|month|months|today|yesterday)\b", _lower(user_input)):
        questions.append("How long have these symptoms been present?")

    if age is None:
        missing_fields.append("age")
        questions.append("What is the patient age?")
    if not gender:
        missing_fields.append("gender")
        questions.append("What is the patient's sex assigned at birth?")
    if medical_history is None:
        missing_fields.append("medical_history")
        questions.append("Any chronic medical conditions or prior similar episodes?")
    if current_medications is None:
        missing_fields.append("current_medications")
        questions.append("What medications or supplements are currently being taken?")
    if allergies is None:
        missing_fields.append("allergies")
        questions.append("Any known medication or food allergies?")

    if red_flags:
        questions.insert(0, "Are life-threatening symptoms active right now (severe chest pain, breathing trouble, stroke signs)?")

    deduped_questions = list(dict.fromkeys(questions))
    return deduped_questions[:10], missing_fields, inferred


def extract_triage_facts(user_input: str) -> dict[str, Any]:
    """Extract structured triage facts from free-text input."""
    normalized = _lower(user_input)
    red_flags = detect_red_flags(user_input)
    symptoms = infer_symptoms(user_input)

    severity_match = re.search(r"\b([0-9]|10)\s*/\s*10\b", normalized)
    inferred_severity = int(severity_match.group(1)) if severity_match else None

    duration_match = re.search(
        r"\b(\d+)\s*(hour|hours|day|days|week|weeks|month|months)\b",
        normalized,
    )
    inferred_duration = None
    if duration_match:
        inferred_duration = f"{duration_match.group(1)} {duration_match.group(2)}"
    elif "today" in normalized:
        inferred_duration = "today"
    elif "yesterday" in normalized:
        inferred_duration = "since yesterday"

    context = {
        "mentions_fever": "fever" in normalized or "temperature" in normalized,
        "mentions_pain": "pain" in normalized,
        "mentions_worsening": any(term in normalized for term in ("worse", "worsening", "progressive")),
        "mentions_nighttime": "night" in normalized,
    }

    return {
        "inferred_symptoms": symptoms,
        "inferred_duration": inferred_duration,
        "inferred_severity": inferred_severity,
        "inferred_context": context,
        "red_flags": red_flags,
    }


def summarize_handoff(
    user_input: str,
    analysis: dict[str, Any],
) -> tuple[str, dict[str, Any]]:
    """Create a clinician handoff summary from analysis output."""
    symptoms = analysis.get("symptoms", [])
    diagnoses = analysis.get("preliminary_diagnosis", [])
    urgency = analysis.get("urgency_level", "unknown")
    recommendations = analysis.get("recommendations", [])
    red_flags = analysis.get("risk_assessment", {}).get("red_flags", [])
    confidence = analysis.get("confidence_score", 0.0)
    when_to_see = analysis.get("when_to_see_doctor", "Consult a healthcare professional.")

    structured = {
        "chief_complaint": user_input,
        "symptoms": symptoms,
        "possible_conditions": diagnoses,
        "urgency": urgency,
        "red_flags": red_flags,
        "recommended_actions": recommendations,
        "seek_care_guidance": when_to_see,
        "confidence_score": confidence,
    }

    report = "\n".join(
        [
            "# SymptomSync Handoff Report",
            f"- Chief complaint: {user_input}",
            f"- Symptoms: {', '.join(symptoms) if symptoms else 'Not identified'}",
            f"- Possible conditions: {', '.join(diagnoses) if diagnoses else 'None identified'}",
            f"- Urgency: {urgency}",
            f"- Red flags: {', '.join(red_flags) if red_flags else 'None'}",
            f"- Confidence score: {confidence}",
            f"- Seek-care guidance: {when_to_see}",
            "## Suggested Actions",
            *(f"- {item}" for item in recommendations[:8]),
        ]
    )
    return report, structured


def compare_snapshots(
    baseline_symptoms: list[str],
    followup_symptoms: list[str],
    baseline_urgency: str,
    followup_urgency: str,
    baseline_red_flags: list[str],
    followup_red_flags: list[str],
) -> dict[str, Any]:
    """Compare two symptom snapshots and return trend metadata."""
    baseline_set = set(item.lower() for item in baseline_symptoms)
    followup_set = set(item.lower() for item in followup_symptoms)

    new_symptoms = sorted(followup_set - baseline_set)
    resolved_symptoms = sorted(baseline_set - followup_set)
    persistent_symptoms = sorted(baseline_set & followup_set)

    baseline_rank = URGENCY_RANK.get(baseline_urgency, -1)
    followup_rank = URGENCY_RANK.get(followup_urgency, -1)
    if followup_rank > baseline_rank:
        trend = "worsening"
    elif followup_rank < baseline_rank:
        trend = "improving"
    else:
        trend = "stable"

    baseline_flags = set(flag.lower() for flag in baseline_red_flags)
    followup_flags = set(flag.lower() for flag in followup_red_flags)

    summary = (
        f"Symptoms are {trend}. New: {', '.join(new_symptoms) or 'none'}, "
        f"resolved: {', '.join(resolved_symptoms) or 'none'}."
    )

    return {
        "new_symptoms": new_symptoms,
        "resolved_symptoms": resolved_symptoms,
        "persistent_symptoms": persistent_symptoms,
        "urgency_trend": trend,
        "red_flag_changes": {
            "new": sorted(followup_flags - baseline_flags),
            "resolved": sorted(baseline_flags - followup_flags),
        },
        "summary": summary,
    }


def compute_risk_score(
    urgency_level: str,
    red_flags: list[str],
    age: int | None = None,
    known_conditions: list[str] | None = None,
    severity_hint: int | None = None,
) -> dict[str, Any]:
    """Compute deterministic risk score and tier."""
    urgency = urgency_level if urgency_level in URGENCY_RANK else "medium"
    score = URGENCY_RANK[urgency] * 22
    factors: list[str] = [f"Base risk from urgency '{urgency}'."]

    if red_flags:
        score += min(30, 10 * len(red_flags))
        factors.append("Red flags present.")

    if age is not None:
        if age >= 75:
            score += 15
            factors.append("Age >= 75 increased risk.")
        elif age >= 60:
            score += 8
            factors.append("Age >= 60 increased risk.")
        elif age <= 5:
            score += 8
            factors.append("Very young patient increased risk.")

    severity = max(0, min(10, severity_hint or 0))
    if severity >= 8:
        score += 15
        factors.append("High severity score (>=8/10).")
    elif severity >= 5:
        score += 8
        factors.append("Moderate severity score (5-7/10).")

    for condition in (known_conditions or []):
        key = condition.lower().strip()
        if key in RISK_CONDITION_WEIGHTS:
            score += RISK_CONDITION_WEIGHTS[key]
            factors.append(f"Risk condition detected: {condition}.")

    score = max(0, min(100, score))
    if score >= 75:
        tier = "critical"
        suggested_urgency = "emergency"
    elif score >= 55:
        tier = "high"
        suggested_urgency = "high"
    elif score >= 30:
        tier = "moderate"
        suggested_urgency = "medium"
    else:
        tier = "low"
        suggested_urgency = "low"

    return {
        "risk_score": score,
        "risk_tier": tier,
        "contributing_factors": factors,
        "suggested_urgency": suggested_urgency,
    }


def explain_urgency(urgency_level: str) -> dict[str, Any]:
    """Provide structured urgency explanation and action guidance."""
    urgency = urgency_level if urgency_level in URGENCY_RANK else "medium"
    immediate_actions = {
        "low": ["Continue monitoring at home.", "Use conservative self-care measures."],
        "medium": ["Arrange prompt outpatient review.", "Track symptom progression closely."],
        "high": ["Seek urgent in-person medical evaluation today.", "Do not delay care if worsening."],
        "emergency": ["Call emergency services immediately.", "Do not self-transport if unstable."],
    }[urgency]

    return {
        "urgency_level": urgency,
        "explanation": URGENCY_EXPLANATIONS[urgency],
        "immediate_actions": immediate_actions,
        "seek_care_threshold": SEEK_CARE_THRESHOLDS[urgency],
    }


def recommend_care_setting(
    urgency_level: str,
    risk_score: int,
    has_primary_care: bool = True,
) -> dict[str, Any]:
    """Recommend an appropriate care setting from urgency and risk."""
    urgency = urgency_level if urgency_level in URGENCY_RANK else "medium"
    score = max(0, min(100, risk_score))
    rationale = [f"Urgency={urgency}", f"Risk score={score}"]

    if urgency == "emergency" or score >= 80:
        return {
            "care_setting": "emergency_department",
            "timeframe": "immediately",
            "rationale": rationale + ["Potential life-threatening pattern."],
        }
    if urgency == "high" or score >= 60:
        return {
            "care_setting": "urgent_care",
            "timeframe": "today",
            "rationale": rationale + ["High near-term risk warrants urgent evaluation."],
        }
    if urgency == "medium" or score >= 35:
        return {
            "care_setting": "primary_care" if has_primary_care else "telehealth",
            "timeframe": "within 24 hours",
            "rationale": rationale + ["Prompt outpatient assessment recommended."],
        }
    return {
        "care_setting": "home_monitoring",
        "timeframe": "self-monitor with follow-up if not improving",
        "rationale": rationale + ["Low immediate risk without red-flag signals."],
    }


def build_self_care_plan(
    symptoms: list[str],
    urgency_level: str,
    allergies: list[str] | None = None,
    current_medications: list[str] | None = None,
) -> dict[str, Any]:
    """Build a safety-oriented self-care plan."""
    urgency = urgency_level if urgency_level in URGENCY_RANK else "medium"
    normalized_symptoms = [item.lower() for item in symptoms]

    actions: list[str] = []
    for symptom in normalized_symptoms:
        actions.extend(SELF_CARE_LIBRARY.get(symptom, []))

    if not actions:
        actions.extend(
            [
                "Stay hydrated and rest.",
                "Avoid heavy exertion until symptoms improve.",
            ]
        )
    actions = list(dict.fromkeys(actions))[:10]

    avoid = [
        "Avoid self-prescribing new medications.",
        "Avoid ignoring rapidly worsening symptoms.",
    ]
    if allergies:
        avoid.append("Avoid products that may contain known allergens.")
    if current_medications:
        avoid.append("Avoid adding over-the-counter medicines without checking interactions.")

    plan = {
        "urgency_level": urgency,
        "actions": actions if urgency in {"low", "medium"} else ["Prioritize urgent medical evaluation over home care."],
        "avoid": avoid,
        "monitoring": GENERAL_MONITORING,
    }
    return plan


def build_monitoring_schedule(
    symptoms: list[str],
    urgency_level: str,
    red_flags: list[str] | None = None,
) -> dict[str, Any]:
    """Build a symptom monitoring schedule and escalation triggers."""
    urgency = urgency_level if urgency_level in URGENCY_RANK else "medium"
    flags = [f.lower() for f in (red_flags or [])]
    normalized = [s.lower() for s in symptoms]

    if urgency == "low":
        interval = 360
        window = 48
    elif urgency == "medium":
        interval = 180
        window = 24
    elif urgency == "high":
        interval = 60
        window = 12
    else:
        interval = 15
        window = 2

    required_checks = [
        "Record symptom severity (0-10).",
        "Track onset/progression notes for each check-in.",
        "Record hydration and oral intake status.",
    ]
    if "fever" in normalized:
        required_checks.append("Measure and record temperature.")
    if "difficulty breathing" in flags or "cough" in normalized:
        required_checks.append("Track breathing effort and ability to speak full sentences.")

    escalation_triggers = [
        "Any newly developed red-flag symptom.",
        "Severity increases by 2+ points between check-ins.",
        "No improvement within the monitoring window.",
    ]
    if urgency in {"high", "emergency"}:
        escalation_triggers.insert(0, "Immediate in-person care is already indicated.")

    return {
        "check_interval_minutes": interval,
        "monitoring_window_hours": window,
        "required_checks": required_checks,
        "escalation_triggers": escalation_triggers,
    }


def emergency_checklist(red_flags: list[str]) -> dict[str, Any]:
    """Build immediate emergency checklist from detected red flags."""
    flags = [flag.lower() for flag in red_flags]
    immediate_steps = [
        "Call emergency services now.",
        "Stay with the patient and monitor breathing/consciousness.",
        "Do not give food or drink if choking, altered, or unconscious.",
    ]
    if "severe bleeding" in flags:
        immediate_steps.append("Apply direct pressure to bleeding areas with clean cloth.")
    if "stroke-like symptoms" in flags:
        immediate_steps.append("Note symptom onset time for emergency responders.")

    return {
        "detected_red_flags": flags,
        "immediate_steps": list(dict.fromkeys(immediate_steps)),
        "emergency_contacts": ["911 (US emergency services)", "Local emergency department"],
    }


def redact_sensitive_text(text: str) -> dict[str, Any]:
    """Redact common PII patterns from free text."""
    redaction_types: list[str] = []
    redacted = text

    replacements = [
        ("email", EMAIL_PATTERN, "[REDACTED_EMAIL]"),
        ("phone", PHONE_PATTERN, "[REDACTED_PHONE]"),
        ("ssn", SSN_PATTERN, "[REDACTED_SSN]"),
        ("dob", DOB_PATTERN, "[REDACTED_DOB]"),
        ("mrn", MRN_PATTERN, "[REDACTED_MRN]"),
    ]

    redaction_count = 0
    for label, pattern, replacement in replacements:
        matches = pattern.findall(redacted)
        if matches:
            redaction_types.append(label)
            redaction_count += len(matches)
            redacted = pattern.sub(replacement, redacted)

    return {
        "redacted_text": redacted,
        "redaction_count": redaction_count,
        "redaction_types": redaction_types,
    }


def urgency_matrix() -> dict[str, Any]:
    """Return urgency matrix for client rendering."""
    return {
        level: {
            "rank": rank,
            "explanation": URGENCY_EXPLANATIONS[level],
            "seek_care_threshold": SEEK_CARE_THRESHOLDS[level],
        }
        for level, rank in URGENCY_RANK.items()
    }
