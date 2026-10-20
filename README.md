# mini eCitizen — Public Service Request System

**mini eCitizen** is a modern, responsive civic service portal designed for community issue reporting and municipal resolution tracking. Citizens can submit issues with clear location details and issue categories, while administrators track progress, dispatch crews, provide resolution feedback, and review civic analytics.

---

## 🌟 Key Features

### 👤 Citizen Experience
- **Authentication**:
  - Sign in & registration on the same screen (toggle between them).
  - Clean Firebase Email and Password flow with friendly validation messages.
  - Show/hide password toggle and "Forgot password?" password reset via email.
  - Dedicated Citizen sign up with no admin exposure.
- **Service Request Submission**:
  - Category selection: *Broken Streetlight, Water & Sewage, Garbage Collection, Road Pothole, Public Health, Parks & Green Spaces, Other*.
  - Direct **Location & Address** input (street address, building, or landmark).
  - Optional **Photo / Evidence Upload**: Citizens can attach an optional photo (JPG/PNG). The browser automatically resizes and compresses it (max 800px width, ~0.7 JPEG quality, under 500 KB) and stores it directly as a Base64 string in Firestore without requiring Firebase Storage.
  - Interactive photo preview with a **Remove image** button before submitting.
  - Detailed description with live character counter.
  - **Instant Submission Confirmation Receipt**: Displays green checkmark, generated Ticket ID reference (`#REQ-XXXX`), category badge, address, attached photo status, and current status (*Pending Review*).
- **Dashboard & Requests**:
  - Overview KPI counters (*Total Requests, Pending, In Progress, Resolved*).
  - Search and filter by status or category.
  - Grid card view and table view modes.
  - Detailed inspection view with full timeline.
  - **Service Lifecycle Stepper**: Submitted ➔ Under Review & Dispatched ➔ Issue Resolved.
  - Ability to **edit** or **cancel** requests while still in *Pending* status.
  - CSV export for citizen personal records.
- **Profile Management**: Update full name, phone number, and change account password.

### 🛡️ Administrator Command Center
- **Official Administrative Access**:
  - Discrete access link on the Sign In page for verified municipal officials.
  - Authenticates securely using administrator email (`francisnjogu157@gmail.com`) and password only.
  - Directs verified administrators straight to the Admin Command Center upon sign-in.
- **All Community Requests**: Tabular view of all tickets filed across the municipality.
- **Status Workflow**: Direct transition between *Pending ➔ In Progress ➔ Resolved*.
- **Admin Resolution Notes**: Add notes explaining actions taken (e.g., "Water services team dispatched to repair main valve").
- **Email-Style Notification Simulation**: Visual alert feedback whenever a ticket status changes.
- **Civic Analytics**: Real-time resolution efficiency gauge, category breakdown charts, and turnaround rates.
- **Bulk CSV Export**: Export citizen requests for city councils or reporting.

### 🎨 Visual Design & Usability
- **Civic Color Palette**: Dark navy sidebar (`#0a1128`), clean white/light grey content area, and semantic status indicators:
  - 🟡 **Pending**: Amber
  - 🔵 **In Progress**: Blue
  - 🟢 **Resolved**: Emerald Green
- **Functional Light & Dark Mode**:
  - Fully working theme switcher accessible from the Auth page, the top Header, and the Sidebar.
  - Preferences persisted to `localStorage` with system preference pre-detection.
- **Accessibility & Responsiveness**: Optimized for mobile, tablet, and desktop screens with collapsible drawer navigation.

---

## 💻 Tech Stack
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons
- **Backend & Database**: Firebase Authentication (Email/Password), Cloud Firestore
- **Security**: Granular Attribute-Based Access Control (`firestore.rules`)

---

## 🔒 Security Rules

### Firestore (`firestore.rules`)
- **Catch-All Protection**: Top-level default-deny rule.
- **Citizen Integrity**:
  - Citizens can only read and write documents where `userId == request.auth.uid`.
  - Citizens cannot modify the `status` or write `adminNote`.
  - Edits and deletions by citizens are permitted only while `status == 'Pending'`.
- **Admin Privilege**:
  - Users with designated admin email (`francisnjogu157@gmail.com`) or records in the `/admins/` collection can view all requests and update status/notes.

---

## 🚀 Running Locally

### 1. Prerequisites
- Node.js (v18+ or v20+)
- npm or pnpm or bun

### 2. Installation
```bash
# Clone or navigate to the project directory
cd mini-ecitizen

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be accessible at `http://localhost:3000`.

---

## 🔑 Administrator Setup

1. **Required Administrator Email**: `francisnjogu157@gmail.com`
2. **Accessing the Admin Portal**:
   - On the Sign In screen, click **"Administrator / Official Sign In"**.
   - Enter `francisnjogu157@gmail.com`, your Admin User ID (e.g. `francisnjogu157`), and your password.
   - On signing in, the portal automatically identifies the admin identity and directs you straight to the **Admin Command Center**.
   - You can also sign up or sign in as a citizen using any regular email to test the citizen submission workflow.

---

## 🌐 Deployment Instructions (Firebase Hosting)

```bash
# 1. Install Firebase CLI globally if needed
npm install -g firebase-tools

# 2. Log in to Firebase
firebase login

# 3. Build production bundle
npm run build

# 4. Deploy to Firebase
firebase deploy --only hosting,firestore:rules
```
