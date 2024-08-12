import pandas as pd
import datetime
from sklearn.linear_model import LinearRegression

class RiskPredictor:
    def __init__(self):
        self.low = [
            ["Drive Brake Control", 1, 2],
            ["Fuel Level", 1, 1],
            ["Misc Air Filter Pressure Drop", 20, 2]
        ]
        self.low_df = pd.DataFrame(self.low, columns=["Parameter", "Threshold", "Probability"])

        self.lowhigh = [
            ["Engine Oil Pressure", 25, 65, 3],
            ["Drive Transmission Pressure", 200, 450, 2],
            ["Fuel Pressure", 35, 65, 1],
            ["Misc System Voltage", 12.0, 15.0, 3]
        ]
        self.lowhigh_df = pd.DataFrame(self.lowhigh, columns=["Parameter", "Threshold Low", "Threshold High", "Probability"])

        self.high = [
            ["Engine Speed", 1800, 2],
            ["Engine Temperature", 105, 3],
            ["Drive Pedal Sensor", 4.7, 1],
            ["Fuel Water Fuel", 1800, 3],
            ["Fuel Temperature", 400, 3],
            ["Misc Exhaust Gas Temperature", 365, 3],
            ["Misc Hydraulic Pump Rate", 125, 2]
        ]
        self.high_df = pd.DataFrame(self.high, columns=["Parameter", "Threshold", "Probability"])

        self.thresholds = [self.low_df, self.lowhigh_df, self.high_df]

    def _get_current_table(self, parameter_name):
        for table in self.thresholds:
            if parameter_name in table["Parameter"].values:
                return table
        return None

    def _calculate_slope_and_intercept(self, df):
        model = LinearRegression()
        df["time"] = pd.to_datetime(df["time"])
        df["numDate"] = df["time"].map(pd.Timestamp.toordinal)

        x = df[["numDate"]]
        y = df[["value"]]

        model.fit(x, y)
        slope = model.coef_[0][0]
        intercept = model.intercept_[0]

        # Handle case where slope is zero
        if slope == 0.0:
            slope = 1.0

        return slope, intercept

    def _determine_risk(self, slope, intercept, current_table, name, y, single_entry_flag):
        threshold, risk_val, flag = None, 0, 0

        if current_table.shape[1] == self.lowhigh_df.shape[1]:  # LowHigh case
            threshold_low = current_table.iloc[0]["Threshold Low"]
            threshold_high = current_table.iloc[0]["Threshold High"]
            risk_val = current_table.iloc[0]["Probability"]
            if slope >= 0 and (y.iloc[0, 0] < threshold_high and y.iloc[0, 0] > threshold_low):
                return f"Your {name} is currently in safe condition."
        else:  # Low or High case
            threshold = current_table.iloc[0]["Threshold"]
            risk_val = current_table.iloc[0]["Probability"]
            if slope >= 0:
                if current_table.equals(self.low_df):
                    flag = 1
                    if single_entry_flag == 1 and y.iloc[0, 0] > threshold:
                        return f"Your {name} is currently in safe condition."
                else:
                    if single_entry_flag == 1 and y.iloc[0, 0] < threshold:
                        return f"Your {name} is currently in safe condition."
        
        return self._generate_statement(name, threshold, intercept, slope, flag, risk_val)

    def _generate_statement(self, name, threshold, intercept, slope, flag, risk_val):
        if flag == 0:
            date_pred = round((threshold - intercept) / slope)
            proper_date = datetime.date.fromordinal(date_pred)
        else:
            proper_date = datetime.date(2024, 8, 20)  # Arbitrary future date

        proper_date = pd.to_datetime(proper_date)
        current_date = pd.to_datetime(datetime.date.today())
        num_days = (proper_date - current_date).days

        if risk_val == 0:
            return f"Your {name} is perfectly fine!"
        elif num_days <= 0:
            return f"Your {name} is in danger zone. Kindly visit your local service centre as soon as possible."
        else:
            return f"Your {name} will get damaged in about {num_days} days."

    def reg(self, df):
        name = f"{df.iloc[0]['machine']} {df.iloc[0]['component']}"
        current_table = self._get_current_table(name)

        if current_table is None:
            return f"No risk data available for {name}."

        slope, intercept = self._calculate_slope_and_intercept(df)
        single_entry_flag = (len(df) == 1)

        return self._determine_risk(slope, intercept, current_table, name, df["value"], single_entry_flag)

    def make_groups(self, df):
        grouped = df.groupby(['id', 'machine', 'component', 'parameter'])
        return [group_df.reset_index(drop=True) for _, group_df in grouped]

    def predict(self, json_data):
        df = pd.DataFrame(json_data)
        return [self.reg(group) for group in self.make_groups(df)]
