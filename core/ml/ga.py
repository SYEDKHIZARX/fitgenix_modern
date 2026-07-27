"""Genetic algorithm calorie model — pure."""
import numpy as np

def predict_calories(steps,distance,intensity_score,active_minutes,scaler,ga_model):
    raw  = np.array([[steps,distance,0,intensity_score,0,active_minutes]])
    norm = scaler.transform(raw)
    x    = np.array([norm[0][0],norm[0][1],norm[0][3],norm[0][5]])
    w,b  = ga_model[:-1], ga_model[-1]
    return float(np.clip(np.dot(x,w)+b, 0, 1))

def adaptive_ga_retrain(history):
    if len(history)<7: return None,None
    # Build rows defensively: skip entries missing the needed numeric fields,
    # and coerce to float so a stray None can't poison the array into nan.
    rows=[]
    for h in history:
        try:
            s  = float(h.get("steps") or 0)
            am = float(h.get("active_minutes") or 0)
            bmi= float(h.get("bmi") or 22.0)
            cs = h.get("calorie_score")
            if cs is None:  # need a target to fit against
                continue
            rows.append([s, am, bmi, float(cs)])
        except (TypeError, ValueError):
            continue
    if len(rows) < 7:
        return None, None
    data=np.array(rows,dtype=float)
    col_min=data.min(axis=0); col_rng=np.where((data.max(axis=0)-col_min)==0,1,data.max(axis=0)-col_min)
    data_n=(data-col_min)/col_rng; X,y=data_n[:,:3],data_n[:,3]
    # if the target has no variance, MAE-based fitness is meaningless -> bail cleanly
    if np.allclose(y, y[0]):
        return None, None
    N_POP,N_GEN,MUT=30,50,0.1
    pop=np.random.randn(N_POP,4)*0.5
    def mae(c):
        v = np.mean(np.abs(X@c[:-1]+c[-1]-y))
        return v if np.isfinite(v) else 1e9
    best_c,best_m=pop[0],mae(pop[0])
    for _ in range(N_GEN):
        fit=np.array([mae(c) for c in pop]); idx=np.argsort(fit); pop=pop[idx]
        if fit[idx[0]]<best_m: best_m=fit[idx[0]]; best_c=pop[0].copy()
        new=[pop[0],pop[1]]
        while len(new)<N_POP:
            p1,p2=pop[np.random.randint(0,10)],pop[np.random.randint(0,10)]
            pt=np.random.randint(1,3); child=np.concatenate([p1[:pt],p2[pt:]])
            child+=(np.random.rand(4)<MUT)*np.random.randn(4)*0.1; new.append(child)
        pop=np.array(new)
    if not np.isfinite(best_m):
        return None, None
    return best_c,round(float(best_m),5)

