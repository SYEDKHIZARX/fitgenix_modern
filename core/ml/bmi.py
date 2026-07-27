"""BMI calculation — pure."""

def calculate_bmi(weight_kg,height_cm):
    h=height_cm/100; bmi=weight_kg/(h**2)
    if   bmi<18.5: cat,col="Underweight","#00B4FF"
    elif bmi<25:   cat,col="Normal weight","#00E676"
    elif bmi<30:   cat,col="Overweight","#FF6B35"
    else:          cat,col="Obese","#FF4D00"
    return round(bmi,1),cat,col

