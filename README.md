# Digital-library-web
Automated Library Management System using AI
## 🎯 Purpose & Abstract
A web application designed to simplify educational library workflows. It automates book availability using barcode scanning, sends timely return reminders, recommends books via AI based on borrowing history, and supports online book reservations with librarian approval. The goal is to enhance efficiency, accountability, and user experience for both students and librarians.

## **Step-by-Step Setup**

### **1. Create Project Folder**
# Open terminal/command prompt
mkdir library-management-system
cd library-management-system
**2. Initialize Next.js Project**
# Create a new Next.js project
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"

When prompted, choose:

- ✅ TypeScript
- ✅ ESLint
- ✅ Tailwind CSS
- ✅ App Router
- ❌ src/ directory
- ✅ Import alias (@/*)


### **3. Install Required Dependencies**

# Install shadcn/ui components
npx shadcn@latest init

# Install additional dependencies
npm install @radix-ui/react-tabs @radix-ui/react-select @radix-ui/react-badge
npm install lucide-react
npm install quagga
```

### **4. Add shadcn/ui Components**

# Install required UI components
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add select
npx shadcn@latest add badge
npx shadcn@latest add tabs
npx shadcn@latest add separator
```

### **5. Open in VS Code**


# Open the project in VS Code
code .
```

### **6. Create Project Structure**

In VS Code, create these folders and files:

```plaintext
library-management-system/
├── app/
│   ├── api/
│   │   └── send-sms/
│   │       └── route.ts
│   ├── librarian/
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── student/
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── user-selection/
│   │   └── page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/ (created by shadcn)
│   └── barcode-scanner.tsx
├── lib/
│   ├── book-data.ts
│   ├── storage-utils.ts
│   ├── recommendation-engine.ts
│   ├── barcode-scanner.ts
│   ├── sms-service.ts
│   └── twilio-sms.ts
└── package.json
```

### **7. Copy the Code**
You can:

1. **Right-click** on each folder/file in VS Code Explorer
2. **Select "New File"** or **"New Folder"**
3. **Paste the code** from the CodeProject above


### **8. Environment Variables (Optional)**

Create a `.env.local` file in the root directory:

# .env.local
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_FROM_NUMBER=your_twilio_phone_number

### **9. Run the Development Server**

# Start the development server
npm run dev


### **10. Open in Browser**

Open your browser and go to:

```plaintext
http://localhost:3000
### **VS Code Extensions (Recommended)**

Install these helpful extensions:

1. **ES7+ React/Redux/React-Native snippets**
2. **Tailwind CSS IntelliSense**
3. **TypeScript Importer**
4. **Auto Rename Tag**
5. **Prettier - Code formatter**
6. **ESLint**
# Run in development mode
npm run dev  
# Build for production
npm run build     
cd server
npm start       
## 💻  Usage Guide
## Student Flow
Register or log in
Browse or search the catalog
Reserve books (with librarian approval)

Issue/Return via barcode scanner
Receive SMS/email reminders for due dates


View AI-generated book recommendations
## Librarian Flow
Log in
Add, edit, or remove books
Approve or reject reservations
Process barcode-based book transactions
Send overdue reminders manually or automatically
 # You can check the here how it looks
![image alt](https://github.com/domasreeja/Digital-library-web/blob/main/Home_page.png?raw=true)
