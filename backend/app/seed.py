"""Seed the database with 8 companies and 28 health insurance policies.

Idempotent: if the catalogue already has any policies / companies, it skips.
Run with: python -m app.seed
"""
from __future__ import annotations

import uuid

from .database import SessionLocal, engine, Base
from . import models

COMPANIES = [
    {
        "id": uuid.UUID("11111111-1111-1111-1111-111111111111"),
        "name": "SecureLife Insurance",
        "claim_settlement_ratio": 98.2, "customer_rating": 4.6, "network_hospitals": 9500,
        "support_availability": "24x7 helpline, chat & app",
        "description": "Pan-India insurer with one of the highest claim settlement ratios and a wide cashless hospital network.",
    },
    {
        "id": uuid.UUID("22222222-2222-2222-2222-222222222222"),
        "name": "HealthFirst Mutual",
        "claim_settlement_ratio": 96.5, "customer_rating": 4.4, "network_hospitals": 7800,
        "support_availability": "24x7 helpline & email",
        "description": "Cooperative-style health insurer focused on families and salaried customers.",
    },
    {
        "id": uuid.UUID("33333333-3333-3333-3333-333333333333"),
        "name": "CareShield Insurance",
        "claim_settlement_ratio": 94.1, "customer_rating": 4.2, "network_hospitals": 6200,
        "support_availability": "8am-10pm helpline",
        "description": "Mid-sized insurer with strong critical illness portfolio.",
    },
    {
        "id": uuid.UUID("44444444-4444-4444-4444-444444444444"),
        "name": "MediCover India",
        "claim_settlement_ratio": 92.8, "customer_rating": 4.1, "network_hospitals": 5400,
        "support_availability": "24x7 helpline",
        "description": "Affordable plans with strong rural network reach.",
    },
    {
        "id": uuid.UUID("55555555-5555-5555-5555-555555555555"),
        "name": "VitalPlus Assurance",
        "claim_settlement_ratio": 95.7, "customer_rating": 4.3, "network_hospitals": 6800,
        "support_availability": "24x7 helpline & WhatsApp",
        "description": "Modern insurer with mobile-first claims and good young-adult plans.",
    },
    {
        "id": uuid.UUID("66666666-6666-6666-6666-666666666666"),
        "name": "Aarogya Health Co.",
        "claim_settlement_ratio": 90.4, "customer_rating": 3.9, "network_hospitals": 4200,
        "support_availability": "9am-9pm helpline",
        "description": "Budget-friendly insurer for first-time buyers.",
    },
    {
        "id": uuid.UUID("77777777-7777-7777-7777-777777777777"),
        "name": "Wellbeing Mutual",
        "claim_settlement_ratio": 97.1, "customer_rating": 4.5, "network_hospitals": 8200,
        "support_availability": "24x7 helpline, chat & app",
        "description": "Premium insurer with international coverage and wellness rewards.",
    },
    {
        "id": uuid.UUID("88888888-8888-8888-8888-888888888888"),
        "name": "NovaCare Insurance",
        "claim_settlement_ratio": 93.6, "customer_rating": 4.0, "network_hospitals": 5100,
        "support_availability": "24x7 helpline",
        "description": "Specialised in senior citizen and chronic-condition plans.",
    },
]


def _p(company_id: str, **kwargs) -> dict:
    """Helper: builds a policy dict with sensible defaults."""
    defaults = dict(
        policy_type="family_floater",
        premium_monthly=1000, coverage_amount=500000, min_age=18, max_age=65,
        max_family_size=4, waiting_period_months=24,
        benefits=["cashless"], exclusions=["cosmetic"],
        ideal_age_band_min=25, ideal_age_band_max=50,
        claim_settlement_ratio=None, network_hospitals=None,
        room_rent_limit="Single private AC room", co_payment_percentage=0,
        maternity_cover=False, pre_existing_coverage=False,
        pre_existing_waiting_months=36, key_benefits_text="", policy_score=80,
    )
    defaults.update(kwargs)
    defaults["company_id"] = uuid.UUID(company_id)
    return defaults


SL = "11111111-1111-1111-1111-111111111111"
HF = "22222222-2222-2222-2222-222222222222"
CS = "33333333-3333-3333-3333-333333333333"
MC = "44444444-4444-4444-4444-444444444444"
VP = "55555555-5555-5555-5555-555555555555"
AH = "66666666-6666-6666-6666-666666666666"
WB = "77777777-7777-7777-7777-777777777777"
NC = "88888888-8888-8888-8888-888888888888"

POLICIES = [
    # SecureLife
    _p(SL, name="SecureLife Family Shield", policy_type="family_floater",
       premium_monthly=1450, coverage_amount=1000000, max_family_size=6, waiting_period_months=24,
       benefits=["cashless","daycare","maternity","ambulance","annual_checkup"],
       ideal_age_band_min=25, ideal_age_band_max=50,
       claim_settlement_ratio=98.5, network_hospitals=9500,
       maternity_cover=True, pre_existing_coverage=True, pre_existing_waiting_months=24,
       key_benefits_text="Cashless across 9,500+ hospitals, free annual checkup, maternity & newborn cover after 2 years.",
       policy_score=92),
    _p(SL, name="SecureLife Individual Care", policy_type="individual",
       premium_monthly=850, coverage_amount=500000, max_family_size=1, waiting_period_months=12,
       benefits=["cashless","daycare","ambulance"], ideal_age_band_min=22, ideal_age_band_max=45,
       claim_settlement_ratio=98.2, network_hospitals=9500,
       room_rent_limit="Twin sharing AC room", co_payment_percentage=10,
       key_benefits_text="Affordable cover for working professionals with quick cashless claims.",
       policy_score=84),
    _p(SL, name="SecureLife Senior Wellness", policy_type="senior",
       premium_monthly=2400, coverage_amount=700000, min_age=55, max_age=85,
       max_family_size=2, waiting_period_months=36,
       benefits=["cashless","daycare","annual_checkup","home_care","ambulance"],
       ideal_age_band_min=55, ideal_age_band_max=80,
       claim_settlement_ratio=98.0, network_hospitals=9500,
       co_payment_percentage=20, pre_existing_coverage=True, pre_existing_waiting_months=24,
       key_benefits_text="Built for 55+: home healthcare, annual checkup, and lifetime renewal.",
       policy_score=88),
    _p(SL, name="SecureLife Maternity Plus", policy_type="maternity",
       premium_monthly=1750, coverage_amount=800000, min_age=22, max_age=45,
       max_family_size=4, waiting_period_months=24,
       benefits=["cashless","maternity","daycare","newborn_cover","annual_checkup","ambulance"],
       ideal_age_band_min=24, ideal_age_band_max=42,
       claim_settlement_ratio=98.4, network_hospitals=9500,
       maternity_cover=True, pre_existing_coverage=True, pre_existing_waiting_months=24,
       key_benefits_text="Maternity, newborn baby cover and post-natal care included.",
       policy_score=90),
    # HealthFirst
    _p(HF, name="HealthFirst Family Floater", policy_type="family_floater",
       premium_monthly=1300, coverage_amount=800000, max_family_size=5, waiting_period_months=24,
       benefits=["cashless","daycare","maternity","ambulance"], exclusions=["cosmetic","self_inflicted"],
       ideal_age_band_min=26, ideal_age_band_max=50,
       claim_settlement_ratio=96.5, network_hospitals=7800, room_rent_limit="Single AC room",
       maternity_cover=True, pre_existing_coverage=True,
       key_benefits_text="Mid-range family plan with maternity benefits and good claim ratio.",
       policy_score=86),
    _p(HF, name="HealthFirst Essential", policy_type="individual",
       premium_monthly=650, coverage_amount=400000, max_family_size=1, waiting_period_months=18,
       benefits=["cashless","ambulance"], exclusions=["cosmetic","dental"],
       ideal_age_band_min=22, ideal_age_band_max=40,
       claim_settlement_ratio=96.5, network_hospitals=7800, room_rent_limit="Twin sharing",
       co_payment_percentage=10, pre_existing_waiting_months=48,
       key_benefits_text="Lowest-priced cashless plan for young adults.",
       policy_score=78),
    _p(HF, name="HealthFirst Premier Family", policy_type="family_floater",
       premium_monthly=2100, coverage_amount=1500000, max_family_size=6, waiting_period_months=24,
       benefits=["cashless","daycare","maternity","ambulance","annual_checkup","home_care","international"],
       ideal_age_band_min=30, ideal_age_band_max=55,
       claim_settlement_ratio=96.8, network_hospitals=7800,
       maternity_cover=True, pre_existing_coverage=True, pre_existing_waiting_months=24,
       key_benefits_text="Premium family cover including international hospitalisation.",
       policy_score=91),
    _p(HF, name="HealthFirst Critical Care", policy_type="critical_illness",
       premium_monthly=1500, coverage_amount=1500000, min_age=25, max_age=65,
       max_family_size=1, waiting_period_months=24,
       benefits=["cashless","critical_illness","daycare","ambulance"],
       exclusions=["cosmetic","self_inflicted"],
       ideal_age_band_min=35, ideal_age_band_max=60,
       claim_settlement_ratio=96.0, network_hospitals=7800, pre_existing_waiting_months=48,
       key_benefits_text="Lumpsum payout on diagnosis of 36 critical illnesses.",
       policy_score=85),
    # CareShield
    _p(CS, name="CareShield Smart Health", policy_type="family_floater",
       premium_monthly=950, coverage_amount=600000, max_family_size=4, waiting_period_months=24,
       benefits=["cashless","daycare","ambulance","annual_checkup"],
       ideal_age_band_min=25, ideal_age_band_max=50,
       claim_settlement_ratio=94.1, network_hospitals=6200, room_rent_limit="Twin sharing AC",
       co_payment_percentage=10, pre_existing_coverage=True,
       key_benefits_text="Smart family plan with annual checkup and cashless network.",
       policy_score=81),
    _p(CS, name="CareShield Budget Plan", policy_type="individual",
       premium_monthly=480, coverage_amount=300000, max_family_size=1, max_age=50, waiting_period_months=24,
       benefits=["cashless","ambulance"], exclusions=["cosmetic","dental","maternity"],
       ideal_age_band_min=22, ideal_age_band_max=40,
       claim_settlement_ratio=94.0, network_hospitals=6200, room_rent_limit="General ward",
       co_payment_percentage=20, pre_existing_waiting_months=48,
       key_benefits_text="Lowest-premium individual cover for first-time buyers.",
       policy_score=72),
    _p(CS, name="CareShield Critical Care", policy_type="critical_illness",
       premium_monthly=1800, coverage_amount=2000000, min_age=25, max_age=65,
       max_family_size=4, waiting_period_months=36,
       benefits=["cashless","daycare","critical_illness","ambulance","home_care"],
       ideal_age_band_min=35, ideal_age_band_max=60,
       claim_settlement_ratio=94.2, network_hospitals=6200,
       key_benefits_text="20 lakh lumpsum on critical illness diagnosis, family-floater variant.",
       policy_score=87),
    # MediCover
    _p(MC, name="MediCover Basic Health", policy_type="individual",
       premium_monthly=550, coverage_amount=350000, max_family_size=2, max_age=55, waiting_period_months=18,
       benefits=["cashless","ambulance"], exclusions=["cosmetic","dental"],
       ideal_age_band_min=22, ideal_age_band_max=45,
       claim_settlement_ratio=92.8, network_hospitals=5400, room_rent_limit="Twin sharing",
       co_payment_percentage=20, pre_existing_waiting_months=48,
       key_benefits_text="Entry-level cashless plan with wide rural hospital reach.",
       policy_score=74),
    _p(MC, name="MediCover Family Plus", policy_type="family_floater",
       premium_monthly=1150, coverage_amount=700000, max_family_size=5, waiting_period_months=24,
       benefits=["cashless","daycare","maternity","ambulance"],
       ideal_age_band_min=26, ideal_age_band_max=50,
       claim_settlement_ratio=92.9, network_hospitals=5400, room_rent_limit="Single AC room",
       co_payment_percentage=10, maternity_cover=True, pre_existing_coverage=True,
       key_benefits_text="Affordable family floater with maternity cover.",
       policy_score=82),
    _p(MC, name="MediCover Diabetes Care", policy_type="chronic",
       premium_monthly=1400, coverage_amount=500000, min_age=30, max_age=70,
       max_family_size=2, waiting_period_months=12,
       benefits=["cashless","daycare","diabetes_management","ambulance","annual_checkup"],
       ideal_age_band_min=35, ideal_age_band_max=65,
       claim_settlement_ratio=92.8, network_hospitals=5400, room_rent_limit="Single AC room",
       co_payment_percentage=10, pre_existing_coverage=True, pre_existing_waiting_months=12,
       key_benefits_text="Dedicated diabetes management plan with low waiting period for diabetics.",
       policy_score=85),
    # VitalPlus
    _p(VP, name="VitalPlus Family Care", policy_type="family_floater",
       premium_monthly=1250, coverage_amount=900000, max_family_size=6, waiting_period_months=24,
       benefits=["cashless","daycare","maternity","ambulance","annual_checkup"],
       ideal_age_band_min=26, ideal_age_band_max=52,
       claim_settlement_ratio=95.8, network_hospitals=6800,
       maternity_cover=True, pre_existing_coverage=True,
       key_benefits_text="Family floater with annual checkup and maternity cover.",
       policy_score=87),
    _p(VP, name="VitalPlus Young Adult", policy_type="individual",
       premium_monthly=580, coverage_amount=500000, max_age=35, max_family_size=1, waiting_period_months=12,
       benefits=["cashless","daycare","ambulance","mental_health"],
       ideal_age_band_min=18, ideal_age_band_max=35,
       claim_settlement_ratio=95.5, network_hospitals=6800, room_rent_limit="Single AC room",
       key_benefits_text="Designed for 18-35 - includes mental health cover and OPD wellness.",
       policy_score=83),
    _p(VP, name="VitalPlus Premier 360", policy_type="family_floater",
       premium_monthly=2600, coverage_amount=2000000, min_age=25, max_family_size=6, waiting_period_months=24,
       benefits=["cashless","daycare","maternity","annual_checkup","home_care","international","critical_illness"],
       ideal_age_band_min=32, ideal_age_band_max=58,
       claim_settlement_ratio=96.0, network_hospitals=6800,
       maternity_cover=True, pre_existing_coverage=True, pre_existing_waiting_months=24,
       key_benefits_text="Top-tier family plan with international cover and critical-illness rider.",
       policy_score=94),
    # Aarogya
    _p(AH, name="Aarogya Saver Plan", policy_type="individual",
       premium_monthly=380, coverage_amount=250000, max_family_size=1, max_age=55, waiting_period_months=24,
       benefits=["cashless","ambulance"], exclusions=["cosmetic","dental","maternity"],
       ideal_age_band_min=22, ideal_age_band_max=40,
       claim_settlement_ratio=90.4, network_hospitals=4200, room_rent_limit="General ward",
       co_payment_percentage=20, pre_existing_waiting_months=48,
       key_benefits_text="Lowest entry-level cover for students and young earners.",
       policy_score=68),
    _p(AH, name="Aarogya Family Basic", policy_type="family_floater",
       premium_monthly=820, coverage_amount=500000, max_family_size=4, waiting_period_months=24,
       benefits=["cashless","daycare","ambulance"], exclusions=["cosmetic","dental"],
       ideal_age_band_min=26, ideal_age_band_max=50,
       claim_settlement_ratio=90.5, network_hospitals=4200, room_rent_limit="Twin sharing AC",
       co_payment_percentage=10, pre_existing_coverage=True, pre_existing_waiting_months=48,
       key_benefits_text="Budget family plan covering hospitalisation and daycare.",
       policy_score=74),
    _p(AH, name="Aarogya Senior Saver", policy_type="senior",
       premium_monthly=1650, coverage_amount=500000, min_age=55, max_age=80,
       max_family_size=2, waiting_period_months=36,
       benefits=["cashless","daycare","annual_checkup","ambulance"],
       ideal_age_band_min=55, ideal_age_band_max=78,
       claim_settlement_ratio=90.6, network_hospitals=4200, room_rent_limit="Single AC room",
       co_payment_percentage=20, pre_existing_coverage=True, pre_existing_waiting_months=24,
       key_benefits_text="Senior citizen plan with annual checkup and lifetime renewal.",
       policy_score=76),
    # Wellbeing
    _p(WB, name="Wellbeing Global Care", policy_type="family_floater",
       premium_monthly=2900, coverage_amount=2500000, max_family_size=6, waiting_period_months=24,
       benefits=["cashless","daycare","maternity","annual_checkup","home_care","international","mental_health"],
       ideal_age_band_min=28, ideal_age_band_max=55,
       claim_settlement_ratio=97.3, network_hospitals=8200,
       maternity_cover=True, pre_existing_coverage=True, pre_existing_waiting_months=24,
       key_benefits_text="Global family cover with mental health and home healthcare.",
       policy_score=95),
    _p(WB, name="Wellbeing Smart Family", policy_type="family_floater",
       premium_monthly=1550, coverage_amount=1000000, max_family_size=6, waiting_period_months=24,
       benefits=["cashless","daycare","maternity","annual_checkup","ambulance"],
       ideal_age_band_min=26, ideal_age_band_max=52,
       claim_settlement_ratio=97.1, network_hospitals=8200,
       maternity_cover=True, pre_existing_coverage=True,
       key_benefits_text="10 lakh family floater with wellness rewards.",
       policy_score=89),
    _p(WB, name="Wellbeing Critical Plus", policy_type="critical_illness",
       premium_monthly=1700, coverage_amount=1500000, min_age=25, max_age=65,
       max_family_size=1, waiting_period_months=24,
       benefits=["cashless","critical_illness","daycare","annual_checkup","ambulance"],
       ideal_age_band_min=35, ideal_age_band_max=60,
       claim_settlement_ratio=97.0, network_hospitals=8200,
       key_benefits_text="36 critical illnesses covered with lumpsum payout.",
       policy_score=88),
    _p(WB, name="Wellbeing Maternity Care", policy_type="maternity",
       premium_monthly=1850, coverage_amount=900000, min_age=22, max_age=45,
       max_family_size=4, waiting_period_months=24,
       benefits=["cashless","maternity","newborn_cover","daycare","annual_checkup"],
       ideal_age_band_min=24, ideal_age_band_max=42,
       claim_settlement_ratio=97.0, network_hospitals=8200,
       maternity_cover=True, pre_existing_coverage=True, pre_existing_waiting_months=24,
       key_benefits_text="Maternity + newborn + annual checkup with wellness rewards.",
       policy_score=90),
    # NovaCare
    _p(NC, name="NovaCare Senior Plus", policy_type="senior",
       premium_monthly=1950, coverage_amount=800000, min_age=55, max_age=85,
       max_family_size=2, waiting_period_months=24,
       benefits=["cashless","daycare","home_care","annual_checkup","ambulance","critical_illness"],
       ideal_age_band_min=55, ideal_age_band_max=80,
       claim_settlement_ratio=93.6, network_hospitals=5100, room_rent_limit="Single AC room",
       co_payment_percentage=10, pre_existing_coverage=True, pre_existing_waiting_months=12,
       key_benefits_text="Senior plan with shorter waiting and critical-illness add-on.",
       policy_score=86),
    _p(NC, name="NovaCare Chronic Care", policy_type="chronic",
       premium_monthly=1300, coverage_amount=600000, min_age=25, max_age=70,
       max_family_size=2, waiting_period_months=12,
       benefits=["cashless","daycare","diabetes_management","annual_checkup","ambulance"],
       ideal_age_band_min=35, ideal_age_band_max=65,
       claim_settlement_ratio=93.5, network_hospitals=5100, room_rent_limit="Single AC room",
       co_payment_percentage=10, pre_existing_coverage=True, pre_existing_waiting_months=12,
       key_benefits_text="For people living with diabetes, hypertension or thyroid.",
       policy_score=84),
    _p(NC, name="NovaCare Young Family", policy_type="family_floater",
       premium_monthly=1100, coverage_amount=700000, max_family_size=4, max_age=55, waiting_period_months=24,
       benefits=["cashless","daycare","maternity","ambulance","annual_checkup"],
       ideal_age_band_min=25, ideal_age_band_max=45,
       claim_settlement_ratio=93.7, network_hospitals=5100, room_rent_limit="Single AC room",
       maternity_cover=True, pre_existing_coverage=True,
       key_benefits_text="Young-family floater with maternity benefit and quick claims.",
       policy_score=83),
    _p(NC, name="NovaCare Essentials", policy_type="individual",
       premium_monthly=520, coverage_amount=400000, max_family_size=1, max_age=55, waiting_period_months=18,
       benefits=["cashless","ambulance","daycare"], exclusions=["cosmetic","dental"],
       ideal_age_band_min=22, ideal_age_band_max=42,
       claim_settlement_ratio=93.5, network_hospitals=5100, room_rent_limit="Twin sharing",
       co_payment_percentage=10, pre_existing_waiting_months=48,
       key_benefits_text="Affordable individual cover for salaried customers.",
       policy_score=75),
]


def run() -> None:
    # Create all tables (idempotent — only creates missing ones)
    Base.metadata.create_all(bind=engine)

    with SessionLocal() as db:
        existing = db.query(models.Company).count()
        if existing > 0:
            print(f"Catalogue already seeded ({existing} companies present). Skipping.")
            return

        for c in COMPANIES:
            db.add(models.Company(**c))
        db.flush()
        for p in POLICIES:
            db.add(models.Policy(**p))
        db.commit()
        print(f"Seeded {len(COMPANIES)} companies and {len(POLICIES)} policies.")


if __name__ == "__main__":
    run()
