from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from datetime import datetime, timedelta
import models, schemas
from database import get_db
from collections import defaultdict

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    def log_debug(msg):
        with open("debug_dashboard_runtime.txt", "a", encoding="utf-8") as f:
            f.write(f"{datetime.now()}: {msg}\n")
            
    log_debug("---/stats called---")
    now = datetime.now()
    start_of_month = datetime(now.year, now.month, 1)
    
    # 1. KPIs
    
    # Monthly Revenue (Faturamento)
    # Filter: pickup_date in current month, status NOT REJECTED or QUOTED
    revenue_query = db.query(func.sum(models.Freight.valor_cliente)).filter(
        models.Freight.pickup_date >= start_of_month,
        models.Freight.status.notin_(['REJECTED', 'QUOTED'])
    ).scalar()
    
    monthly_revenue = revenue_query or 0.0

    # Monthly Driver Cost (Pagamento Motoristas)
    # Filter: pickup_date in current month, status NOT REJECTED or QUOTED
    cost_query = db.query(func.sum(models.Freight.valor_motorista)).filter(
        models.Freight.pickup_date >= start_of_month,
        models.Freight.status.notin_(['REJECTED', 'QUOTED'])
    ).scalar()
    
    monthly_driver_cost = cost_query or 0.0

    # Active Freights
    active_statuses = ['RECRUITING', 'ASSIGNED', 'IN_TRANSIT', 'LOADING']
    active_count = db.query(models.Freight).filter(models.Freight.status.in_(active_statuses)).count()

    # Deliveries Today
    today_start = datetime(now.year, now.month, now.day)
    today_end = today_start + timedelta(days=1)
    deliveries_today_count = db.query(models.Freight).filter(
        models.Freight.delivery_date >= today_start,
        models.Freight.delivery_date < today_end,
        models.Freight.status != 'REJECTED'
    ).count()

    # Delays (Atrasos)
    # Active freights where delivery_date < now
    delayed_count = db.query(models.Freight).filter(
        models.Freight.status.in_(active_statuses),
        models.Freight.delivery_date < now
    ).count()

    # 2. Recent Freights (Table)
    # Get 5 most recent active freights, ordered by pickup date
    recent_freights = db.query(models.Freight).filter(
        models.Freight.status.notin_(['QUOTED', 'REJECTED', 'DELIVERED'])
    ).order_by(models.Freight.pickup_date.asc()).limit(5).all()
    
    # 3. Analytics (Charts)
    
    # Freights by Origin State
    # We need to fetch all active/delivered freights to analyze patterns
    # Limit to last 3 months for relevance
    three_months_ago = now - timedelta(days=90)
    analytics_freights = db.query(models.Freight).filter(
        models.Freight.pickup_date >= three_months_ago,
        models.Freight.status.notin_(['QUOTED', 'REJECTED'])
    ).all()
    
    state_counts = defaultdict(int)
    log_debug(f"Analytics loop start. Count: {len(analytics_freights)}")
    
    for f in analytics_freights:
        # Default bucket
        bucket = "N/A"
        
        if f.origin:
            try:
                # Normalization
                raw = f.origin.strip()
                parsed_state = None
                
                # Logic: Split by dash or comma
                if "-" in raw:
                    parts = raw.split("-")
                    parsed_state = parts[-1].strip().upper()
                elif "," in raw:
                    parts = raw.split(",")
                    parsed_state = parts[-1].strip().upper()
                
                # Validation
                if parsed_state:
                    if len(parsed_state) == 2:
                        bucket = parsed_state
                    elif len(parsed_state) < 4:
                         bucket = parsed_state
                    else:
                        bucket = "Outros"
                else:
                    bucket = "Outros"
            except Exception as e:
                log_debug(f"Error parsing origin '{f.origin}': {e}")
                bucket = "Outros"
        
        state_counts[bucket] += 1
        log_debug(f"Freight {f.id} ('{f.origin}') -> {bucket}")

    log_debug(f"Final State Counts: {dict(state_counts)}")
    freights_by_state = [{"name": k, "value": v} for k, v in state_counts.items()]
    freights_by_state.sort(key=lambda x: x['value'], reverse=True)

    # Freights by Vehicle Type
    # Join with Driver
    vehicle_counts = defaultdict(int)
    
    # We can use a direct query for this, but iterating the already fetched list is fine for small scale
    # Better to query DB directly for correctness if we want ALL time or specific range
    # Let's use the same 'analytics_freights' list (last 3 months)
    for f in analytics_freights:
        if f.driver and f.driver.vehicle_type:
            vehicle_counts[f.driver.vehicle_type] += 1
        else:
            vehicle_counts["Sem Veículo"] += 1
            
    freights_by_vehicle = [{"name": k, "value": v} for k, v in vehicle_counts.items()]
    freights_by_vehicle.sort(key=lambda x: x['value'], reverse=True)

    return {
        "kpis": {
            "monthly_revenue": monthly_revenue,
            "monthly_driver_cost": monthly_driver_cost,
            "active_freights": active_count,
            "deliveries_today": deliveries_today_count,
            "delays": delayed_count
        },
        "recent_freights": recent_freights,
        "charts": {
            "by_state": freights_by_state,
            "by_vehicle": freights_by_vehicle
        }
    }

@router.get("/drilldown", response_model=List[schemas.Freight])
def get_dashboard_drilldown(
    filter_type: str, 
    filter_value: str, 
    db: Session = Depends(get_db)
):
    # Reuse similar logic to main stats: look at last 3 months
    now = datetime.now()
    three_months_ago = now - timedelta(days=90)
    
    query = db.query(models.Freight).filter(
        models.Freight.pickup_date >= three_months_ago,
        models.Freight.status.notin_(['QUOTED', 'REJECTED'])
    )
    
    all_freights = query.all()
    filtered_freights = []
    
    with open("debug_dashboard_runtime.txt", "a", encoding="utf-8") as f:
        f.write(f"{datetime.now()}: Drilldown for type={filter_type} value={filter_value}. Found {len(all_freights)} candidates.\n")
    
    if filter_type == "state":
        for f in all_freights:
            state = "Outros"
            if f.origin:
                if "," in f.origin:
                    s = f.origin.split(",")[-1].strip().upper()
                    if len(s) == 2 or len(s) == 3: state = s
                elif "-" in f.origin:
                    s = f.origin.split("-")[-1].strip().upper()
                    if len(s) == 2 or len(s) == 3: state = s
                elif len(f.origin) == 2:
                     state = f.origin.upper()

            if state == filter_value:
                filtered_freights.append(f)
                
    elif filter_type == "vehicle":
        target = filter_value.strip().upper()
        for f in all_freights:
            v_type = "SEM VEÍCULO"
            if f.driver and f.driver.vehicle_type:
                v_type = f.driver.vehicle_type.strip().upper()
            else:
                 v_type = "SEM VEÍCULO"
            
            if v_type == target:
                filtered_freights.append(f)
            elif v_type == "SEM VEÍCULO" and target == "SEM VEÍCULO":
                 filtered_freights.append(f)

    elif filter_type == "kpi":
        # Specific logic for KPI cards - DIRECT QUERY to match stats logic
        active_statuses = ['RECRUITING', 'ASSIGNED', 'IN_TRANSIT', 'LOADING']
        today_start = datetime(now.year, now.month, now.day)
        today_end = today_start + timedelta(days=1)
        
        if filter_value == "active":
             filtered_freights = db.query(models.Freight).filter(models.Freight.status.in_(active_statuses)).all()
             
        elif filter_value == "today":
             # Delivery date is today
             filtered_freights = db.query(models.Freight).filter(
                models.Freight.delivery_date >= today_start,
                models.Freight.delivery_date < today_end,
                models.Freight.status != 'REJECTED'
             ).all()
             
        elif filter_value == "delayed":
             # Active and late
             filtered_freights = db.query(models.Freight).filter(
                models.Freight.status.in_(active_statuses),
                models.Freight.delivery_date < now
             ).all()

    return filtered_freights
