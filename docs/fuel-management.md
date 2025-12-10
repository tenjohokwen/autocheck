# Fuel Management Guide

## Table of Contents
1. [Overview](#overview)
2. [Data Entry Requirements](#data-entry-requirements)
3. [Understanding Fuel Efficiency Metrics](#understanding-fuel-efficiency-metrics)
4. [How Fuel Efficiency is Calculated](#how-fuel-efficiency-is-calculated)
5. [What is Displayed on the Page](#what-is-displayed-on-the-page)
6. [Practical Example](#practical-example)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The Fuel Management page helps you track fuel consumption, costs, and calculate fuel efficiency for your vehicles. The system uses industry-standard consumption-based methods to provide accurate efficiency metrics in both metric (L/100km) and imperial (MPG) units.

---

## Data Entry Requirements

When adding a fuel record, you need to provide the following information:

### Required Fields

1. **Vehicle** - Select which vehicle was refueled
2. **Date** - When the refueling occurred
3. **Odometer Reading** - The **current total odometer reading** (in km) at the time of refueling
4. **Liters** - How many liters of fuel were added
5. **Cost** - Total cost paid (in FCFA)

### Optional Fields

6. **Fuel Type** - Type of fuel (Regular, Premium, Diesel, Electric, Hybrid)
7. **Full Tank** - Checkbox indicating whether the tank was filled completely (checked by default)
8. **Station** - Name of the gas station
9. **Notes** - Any additional notes

### ⚠️ Important: About the Odometer Reading

**You must enter the CURRENT ODOMETER READING**, not the distance covered since the last fill-up.

- ✅ **Correct**: Enter 15,500 km (the current total on your odometer)
- ❌ **Incorrect**: Enter 300 km (the distance since last fill-up)

The system automatically calculates the distance traveled by comparing consecutive odometer readings.

**Example:**
- Today's odometer: 15,500 km → **Enter 15,500**
- Last fill-up odometer: 15,200 km
- System calculates: 15,500 - 15,200 = 300 km traveled

---

## Understanding Fuel Efficiency Metrics

The system displays two different fuel efficiency metrics. They measure the same thing (fuel efficiency) but in opposite ways:

### L/100km (Liters per 100 kilometers)

**What it measures:** Fuel consumption - how much fuel you use to travel a fixed distance

- **Unit**: Liters per 100 kilometers
- **Lower is better** (less fuel consumed = more efficient)
- **Common in**: Europe, Africa, Asia, Australia (Metric system)
- **Example**: 8.5 L/100km means you use 8.5 liters to drive 100 km

**Efficiency Guide:**
| L/100km | Rating    | Description                    |
|---------|-----------|--------------------------------|
| < 5.0   | Excellent | Very fuel-efficient vehicle    |
| 5.0-7.0 | Very Good | Good fuel economy              |
| 7.0-9.0 | Good      | Average efficiency             |
| 9.0-11.0| Average   | Moderate fuel consumption      |
| > 11.0  | Poor      | High fuel consumption          |

### MPG (Miles Per Gallon)

**What it measures:** Distance per fuel unit - how far you can travel on a fixed amount of fuel

- **Unit**: Miles per gallon (US gallons)
- **Higher is better** (more distance per gallon = more efficient)
- **Common in**: United States, United Kingdom
- **Example**: 27 MPG means you can drive 27 miles on 1 gallon of fuel

**Efficiency Guide:**
| MPG (US) | Rating    | Description                    |
|----------|-----------|--------------------------------|
| > 47     | Excellent | Very fuel-efficient vehicle    |
| 34-47    | Very Good | Good fuel economy              |
| 26-34    | Good      | Average efficiency             |
| 21-26    | Average   | Moderate fuel consumption      |
| < 21     | Poor      | High fuel consumption          |

### Mathematical Relationship

L/100km and MPG are inversely related:

```
MPG ≈ 235.214 / L/100km
```

**Comparison Table:**
| L/100km | MPG (US) | Efficiency |
|---------|----------|------------|
| 5.0     | 47.0     | Excellent  |
| 7.0     | 33.6     | Very Good  |
| 9.0     | 26.1     | Good       |
| 11.0    | 21.4     | Average    |
| 15.0    | 15.7     | Poor       |

### Which Metric Should You Focus On?

**For Cameroon users: Focus on L/100km**

Since Cameroon uses the metric system and FCFA currency, **L/100km is the more relevant metric**. MPG is provided as a bonus for international comparison.

**Remember**: Lower L/100km = Better efficiency

---

## How Fuel Efficiency is Calculated

The system uses a **consumption-based method** to calculate fuel efficiency:

### Step 1: Collect Recent Records

- The system takes the **10 most recent fuel records** for the selected vehicle (sorted by date)
- Requires **at least 2 records** to perform calculations
- If you have less than 2 records, you'll see: "Need at least 2 fuel records to calculate efficiency"

### Step 2: Calculate Distance Traveled

For each pair of consecutive records:

```
Distance = Current Odometer - Previous Odometer
```

**Example:**
- Record 1 (newer): Odometer = 15,500 km
- Record 2 (older): Odometer = 15,200 km
- Distance traveled = 15,500 - 15,200 = **300 km**

### Step 3: Full Tank Filter

⚠️ **Important**: The calculation **only includes records where the tank was filled completely** (`Full Tank` checkbox is checked).

**Why?**
- Partial fill-ups don't give reliable consumption data
- You need to know the tank was topped off to calculate actual consumption
- This is the industry-standard method for accurate efficiency calculation

**What this means:**
- If you uncheck "Full Tank", the record is tracked but NOT used in efficiency calculations
- Always check "Full Tank" when you fill up completely for accurate results

### Step 4: Calculate Total Distance and Fuel

The system sums up:
- **Total Distance**: All kilometers driven between full-tank records
- **Total Liters**: All liters added during full-tank refueling

### Step 5: Calculate Efficiency Metrics

#### Liters per 100 km (L/100km)

```
L/100km = (Total Liters / Total Distance) × 100
```

**Example:**
- Total Liters: 45 L
- Total Distance: 500 km
- L/100km = (45 / 500) × 100 = **9.00 L/100km**

This means the vehicle consumes 9 liters for every 100 kilometers driven.

#### Miles per Gallon (MPG)

For international comparison:

```
MPG = (Total Distance × 0.621371) / (Total Liters × 0.264172)
```

Where:
- 0.621371 converts kilometers to miles
- 0.264172 converts liters to US gallons

---

## What is Displayed on the Page

### 1. Fuel Efficiency Section (Top Card)

Displays for the selected vehicle:

- **Average L/100km** - Fuel consumption rate (lower is better)
- **Average MPG** - Miles per gallon (higher is better)
- **Total Distance** - Total kilometers analyzed in the calculation
- **Total Liters** - Total liters consumed in the analysis
- **Records Analyzed** - Number of records used in calculation
- **Message** - Status message about the calculation

**Possible Messages:**
- "Efficiency calculated successfully" - Calculation completed
- "Need at least 2 fuel records to calculate efficiency" - Add more records
- "No valid full-tank records found for calculation" - Check "Full Tank" on your records

### 2. Fuel Statistics Section (Middle Card)

Displays aggregate statistics for the selected vehicle:

- **Total Cost** - Sum of all fuel costs (in FCFA)
- **Total Liters** - Sum of all liters purchased
- **Average Cost Per Liter** - Total cost divided by total liters (in FCFA/L)

**Note:** Statistics include ALL records (both full tank and partial fill-ups)

### 3. Fuel Record List (Bottom Section)

Shows all individual fuel records with:
- Date of refueling
- Odometer reading
- Liters purchased
- Total cost
- Cost per liter
- Fuel type
- Station name

---

## Practical Example

Let's walk through a complete example:

### Scenario: Adding 3 Fuel Records

**Record 1** (Oldest - December 1)
- Date: 2025-12-01
- Odometer: 10,000 km
- Liters: 40 L
- Cost: 24,000 FCFA
- Full Tank: ✓ Yes
- Cost per liter: 600 FCFA/L

**Record 2** (Middle - December 5)
- Date: 2025-12-05
- Odometer: 10,450 km
- Liters: 38 L
- Cost: 22,800 FCFA
- Full Tank: ✓ Yes
- Cost per liter: 600 FCFA/L

**Record 3** (Newest - December 9)
- Date: 2025-12-09
- Odometer: 10,850 km
- Liters: 35 L
- Cost: 21,000 FCFA
- Full Tank: ✓ Yes
- Cost per liter: 600 FCFA/L

### Calculations

#### Distance Calculations:
- **Between Record 1 and 2**: 10,450 - 10,000 = 450 km
  - Fuel used: 38 L (from Record 2)
- **Between Record 2 and 3**: 10,850 - 10,450 = 400 km
  - Fuel used: 35 L (from Record 3)

**Note**: Record 1's fuel (40 L) was used to drive the 450 km to Record 2

#### Totals:
- **Total Distance**: 450 + 400 = **850 km**
- **Total Liters**: 38 + 35 = **73 L**
- **Total Cost**: 22,800 + 21,000 = **43,800 FCFA** (for the distance driven)

#### Fuel Efficiency:
- **L/100km** = (73 / 850) × 100 = **8.59 L/100km**
- **MPG** = (850 × 0.621371) / (73 × 0.264172) = **27.37 MPG**

**Interpretation**: This vehicle consumes 8.59 liters per 100 kilometers, which is in the "Good" efficiency range.

#### Statistics (All Records):
- **Total Cost**: 24,000 + 22,800 + 21,000 = **67,800 FCFA**
- **Total Liters**: 40 + 38 + 35 = **113 L**
- **Average Cost/L**: 67,800 / 113 = **600 FCFA/L**

---

## Best Practices

### ✅ Do's

1. **Always record the current odometer reading** - Don't try to calculate distance yourself
2. **Check "Full Tank" when you fill up completely** - This ensures accurate efficiency calculations
3. **Add records consistently** - More records = more accurate efficiency tracking
4. **Include the date** - Helps track consumption patterns over time
5. **Note the fuel type** - Different fuel types may have different efficiency
6. **Add records immediately after refueling** - Don't wait or you might forget details

### ❌ Don'ts

1. **Don't enter partial odometer readings** - Always use the full current reading
2. **Don't skip the "Full Tank" checkbox** - If you filled up completely, check it
3. **Don't delete old records** - Historical data helps track trends
4. **Don't enter incorrect odometer values** - This will skew efficiency calculations
5. **Don't worry about partial fill-ups** - They're tracked but don't affect efficiency calculations

### 📊 Tips for Accurate Tracking

1. **Establish a routine** - Add records right after refueling
2. **Take a photo of the receipt** - Add receipt number and cost details
3. **Monitor trends** - Watch for sudden changes in efficiency (may indicate issues)
4. **Compare similar conditions** - Highway vs. city driving affects efficiency
5. **Keep at least 10 records** - More data = better average efficiency calculation

---

## Troubleshooting

### "Need at least 2 fuel records to calculate efficiency"

**Problem**: Not enough records to calculate efficiency

**Solution**: Add at least 2 fuel records with:
- Valid odometer readings (second reading must be higher than first)
- "Full Tank" checkbox checked
- Valid date and fuel amount

---

### "No valid full-tank records found for calculation"

**Problem**: You have records, but none are marked as full tank, or odometer readings are invalid

**Solutions**:
1. Check the "Full Tank" checkbox when filling up completely
2. Verify odometer readings are increasing (not decreasing)
3. Ensure at least 2 records are marked as full tank

---

### Efficiency seems too high or too low

**Possible Causes**:
1. **Incorrect odometer reading** - Double-check the current odometer value
2. **Wrong "Full Tank" status** - Only check it when tank is actually full
3. **Odometer rollback** - If odometer decreased, calculation will be wrong
4. **Mixed fuel types** - Different fuel types may show different efficiency

**Solutions**:
1. Review and edit recent records for accuracy
2. Delete incorrect records and re-enter with correct data
3. Ensure odometer readings are sequential and increasing

---

### Statistics don't match efficiency calculation

**This is normal**:
- **Statistics** include ALL records (full tank and partial fill-ups)
- **Efficiency** only uses full-tank records

**Example**:
- Statistics Total: 200 L (includes partial fill-ups)
- Efficiency calculation: 150 L (only full tanks)

---

### MPG and L/100km don't seem to match

**This is normal**: They measure efficiency in opposite ways
- Lower L/100km = Higher MPG = Better efficiency
- They are mathematically inverse of each other

**Quick check**: Multiply your L/100km by your MPG
- Result should be approximately 235
- Example: 8.5 L/100km × 27.6 MPG ≈ 235

---

## Frequently Asked Questions

### Do I need to fill up the tank every time?

No, but marking "Full Tank" when you do helps with accurate efficiency calculations. Partial fill-ups are tracked but not used in efficiency calculations.

### Can I edit old records?

Yes, you can edit any record. Changes will automatically recalculate efficiency.

### How many records should I keep?

The system uses the 10 most recent records for efficiency. Keep as many as you want for historical tracking.

### What if I forget to add a record?

Add it when you remember - include the correct date and odometer reading. The system sorts by date automatically.

### Can I track multiple vehicles?

Yes, select different vehicles from the dropdown to view their individual efficiency and statistics.

### Why is my efficiency different from the manufacturer's claim?

Manufacturer ratings are tested under ideal conditions. Real-world driving (city traffic, AC use, driving style, load) typically results in different efficiency.

---

## Additional Resources

- For more information on fuel efficiency, consult your vehicle's manual
- Track trends over time to identify potential maintenance needs
- Consider factors like tire pressure, vehicle load, and driving style that affect efficiency

---

**Last Updated**: December 2025
**Version**: 1.0
