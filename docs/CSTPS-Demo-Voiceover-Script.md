# CSTPS Water Supply Monitoring System
# Live Demonstration Voiceover Script

---

## STARTING POINT

Open browser and navigate to: **http://localhost:3000/cstps-pipeline**

---

## PART 1: FIRST IMPRESSION

*Wait for page to fully load*

"Welcome to the CSTPS Water Supply SCADA System. What you see on your screen is a real-time monitoring dashboard that tracks water flowing from IRAI Dam to the CSTPS Reservoir.

At the very top, notice the blue header bar. On the left side, there is a pulsing green dot next to the words SYSTEM ONLINE. This tells us that the system is actively receiving data from our sensors in the field.

In the center of the header, you can see the title CSTPS WATER SUPPLY SCADA with a subtitle showing this is a gravity-fed system. On the right side, you see the current time updating every second. This confirms the system is live and not frozen."

---

## PART 2: VIEW MODE BUTTONS

*Point to the view toggle buttons on the right side of the header*

"Now look at these three buttons: P&ID View, 3D View, and 2D View. These let us see the same data in different visual formats. Right now, we are in 3D View, which shows an isometric illustration of the entire water supply route."

### Clicking 3D View (Default)

*Ensure 3D View is selected*

"In this 3D view, you can see the IRAI Dam on the left side with blue water. Notice the subtle ripple animation on the water surface. This is not just decoration. It confirms the visualization is running properly.

Follow the pipelines from the dam towards the right side of the screen. You will see six small dark boxes floating over the pipelines. These are our Flow Transmitter readings, labeled FT-001 through FT-006. Each box shows the current flow rate in cubic meters per hour.

On the far right, you see the CSTPS Reservoir, and above it, the cooling towers with steam rising. The steam animation indicates the power plant is operational."

### Clicking 2D View

*Click the 2D View button*

"Now I am clicking on 2D View. Watch the screen change.

This is a bird's eye view, looking straight down at the water supply route. You can see the same six flow transmitters, but now positioned on an aerial map layout. This view is useful when you want to understand the physical geography of where each sensor is located.

Notice the FT boxes are smaller in this view but still show the same live data. The green dots on each box indicate the sensor is online and transmitting."

### Clicking P&ID View

*Click the P&ID View button*

"Now I am clicking on P&ID View. This stands for Process and Instrumentation Diagram.

This is the technical engineering view. On the left, you see the IRAI Dam represented as a blue water body with a gray dam wall. Six pipelines extend horizontally from the dam to the CSTPS Reservoir on the right.

Each pipeline has three main components:

First, there is a CV label, which stands for Control Valve. The bowtie shape represents a butterfly valve. The percentage shown tells you how open the valve is. 100 percent means fully open.

Second, there is a circle with FT inside. This is the Flow Transmitter symbol. The number below it identifies which sensor this is.

Third, there is a dark rectangle showing the digital readout. The cyan numbers show the current flow rate. Below that, you see a smaller box showing velocity in meters per second.

When water is flowing, you will see small blue dots moving along the pipeline from left to right. This animation represents the direction and speed of water flow."

---

## PART 3: LEFT SIDE PANEL

*Click back to 3D View for better visibility of panels*

"Let me switch back to 3D View so we can look at the side panels more clearly.

On the left side of the screen, you see four stacked information boxes."

### System Status Box

*Point to the first box*

"The first box is labeled SYSTEM STATUS. It shows three rows:

ONLINE with a green dot shows how many sensors are working normally.

WARNING with a yellow dot shows sensors that have issues but are still transmitting.

OFFLINE with a red dot shows sensors that have stopped communicating.

The numbers on the right tell you exactly how many sensors are in each state. Right now, you can see we have sensors online, which is good."

### Total Flow Rate Box

*Point to the second box*

"The second box shows TOTAL FLOW RATE. This is the combined flow from all six pipelines added together. The large cyan number in the center is the current total in cubic meters per hour.

Below the number, there is a progress bar. This gives you a quick visual of how the current flow compares to the maximum expected flow of 500 cubic meters per hour."

### Total Consumption Box

*Point to the third box*

"The third box shows TOTAL CONSUMPTION. This is the cumulative total of all water that has passed through the system. Think of it like an odometer in a car. It keeps counting up and never resets.

This number is important for billing, water audits, and tracking how much water CSTPS has received over time."

### Active Alarms Box

*Point to the fourth box*

"The fourth box shows ACTIVE ALARMS. If any sensor has a problem, it will appear here with a colored background. Yellow means warning, red means critical.

Each alarm shows the device ID and a short description of the problem, like LOW BATTERY WARNING or COMMUNICATION FAILURE."

### Clicking View All Alarms Button

*Click the View All Alarms button at the bottom of the alarms box*

"Now I am clicking the View All Alarms button.

This takes us to a dedicated alarm management page. Here you can see a complete list of all alarms, both active and historical. Each row shows:

The alarm type.
Which device triggered it.
The severity level.
When it occurred.
The current status.

This page is where operators come to acknowledge alarms and track what actions were taken to resolve issues."

*Click the browser back button or the Back button to return*

"I am clicking Back to return to the main monitoring screen."

---

## PART 4: RIGHT SIDE PANEL

*Point to the right side panel*

"On the right side of the screen, you see a panel titled SENSOR READINGS. This shows detailed information for each of the six flow transmitters.

Each card displays:

FT number at the top, like FT-001.

FLOW in cubic meters per hour.

VEL which is velocity in meters per second.

LEVEL which is the water level inside the pipe in millimeters.

TEMP which is water temperature in Celsius.

TOTAL which is that individual sensor's totalizer reading.

The status dot in the corner of each card matches the sensor status. Green means online, yellow means warning, red means offline."

### Dragging Sensor Cards

*Click and drag one sensor card to a different position*

"These cards can be rearranged by dragging. Watch as I click and hold on this card, then drag it to a different position.

This is useful if an operator wants to prioritize certain pipelines at the top of the list. The arrangement you create stays in place while you are using the system."

---

## PART 5: CLICKING ON FLOW TRANSMITTERS

### Clicking FT Box in Main View

*Click on any FT box in the 3D view, for example FT-001*

"Now I am going to click on one of the flow transmitter boxes in the main view. Watch what happens when I click on FT-001.

The system navigates to a detailed page for this specific sensor. This page shows:

A larger display of all parameters for this sensor.

Historical trend charts showing how flow has changed over time.

Sensor health information like battery level and signal strength.

The exact GPS location where this sensor is installed.

This drill-down view is where technicians go when they need to investigate a specific sensor in detail."

*Click the Back button in the header to return*

"Clicking the Back button returns us to the main overview."

### Clicking Sensor Card in Right Panel

*Click on a sensor card in the right panel, for example FT-002*

"You can also click on any sensor card in the right panel to go to the same detail page. Let me click on FT-002.

You see we arrive at the same type of detail page, but now showing information for sensor 002. This gives operators two ways to access sensor details, whichever is more convenient."

*Click Back to return*

---

## PART 6: HEADER BUTTONS

*Return to main CSTPS page*

### Back Button

*Point to the Back button on the left side of header*

"In the header, the Back button on the left takes you to the main FlowNexus dashboard, which shows all monitored sites, not just CSTPS."

### Reports Button

*Click the Reports button*

"The Reports button opens the reporting module. Here you can generate PDF reports showing flow data, consumption summaries, and alarm history for any date range you select.

These reports can be downloaded and shared with management or used for compliance documentation."

*Click Back to return*

### Refresh Button

*Click the Refresh button*

"The Refresh button manually forces the system to fetch the latest data from the database. Normally, data updates automatically, but this button is useful if you want to confirm you are seeing the absolute latest values."

---

## PART 7: BOTTOM STATUS BAR

*Point to the bottom status bar*

"At the bottom of the screen, there is a status bar showing system health indicators:

PLC CONNECTED confirms the gateway communication is working.

MODBUS OK confirms the sensor protocol is functioning.

DB OK confirms the database connection is active.

SCAN shows the current timestamp of the latest data scan.

DATA shows when the last actual data point was received.

On the right side, you see the system version number. This helps support teams know which version you are running if you report an issue."

---

## PART 8: HOVERING INTERACTIONS

### Hovering Over FT Boxes

*Hover mouse over an FT box without clicking*

"When I move my mouse over a flow transmitter box without clicking, watch what happens.

A tooltip appears showing the device ID and a hint that says Click to view details. The box also gets a glowing border to show it is interactive.

This hover effect helps users discover that these elements are clickable."

### Hovering Over Sensor Cards

*Hover over a sensor card in the right panel*

"Similarly, hovering over a sensor card in the right panel highlights it with a blue border and light blue background. This visual feedback confirms which card you are about to interact with."

### Hovering Over CSTPS Reservoir (P&ID View)

*Switch to P&ID View and hover over the reservoir*

"In the P&ID view, hovering over the CSTPS Reservoir shows a dashed highlight border. This indicates the reservoir element is also interactive for future features."

---

## PART 9: ANIMATIONS TO POINT OUT

*Switch to 3D View*

"Before we finish, let me point out the animations that indicate system health:

Water ripples on the dam and reservoir confirm the visualization is running.

Steam rising from cooling towers shows the animation engine is active.

Pulsing status dots on FT boxes confirm real-time updates.

LIVE indicator in the main view header pulses green when receiving data.

If any of these animations stop, it may indicate a browser issue or connection problem."

---

## CLOSING

"This concludes the walkthrough of the CSTPS Water Supply Monitoring System. To summarize the key interactions:

Use the view mode buttons to switch between P&ID, 3D, and 2D views.

Check the left panel for system status, total flow, and alarms.

Use the right panel to see individual sensor details.

Click any FT box or sensor card to drill down into detailed information.

Use Reports to generate documentation.

Monitor the bottom status bar to confirm system health.

Are there any questions about what we have seen today?"

---

## QUICK REFERENCE TABLE

| Action | What Happens |
|--------|--------------|
| Click P&ID View | Shows engineering diagram with valves and instruments |
| Click 3D View | Shows isometric illustration of dam to reservoir |
| Click 2D View | Shows aerial bird's eye layout |
| Click any FT box | Opens detailed sensor page |
| Click sensor card | Opens detailed sensor page |
| Click View All Alarms | Opens alarm management page |
| Click Reports | Opens report generation module |
| Click Refresh | Forces data refresh |
| Click Back | Returns to previous page |
| Hover over FT box | Shows tooltip with device info |
| Drag sensor card | Reorders the sensor list |

---

**Demo URL:** http://localhost:3000/cstps-pipeline

**Estimated Duration:** 10-15 minutes

---

*Version 3.1 | January 28, 2026 | github.com/chatgptnotes/flownexus*
