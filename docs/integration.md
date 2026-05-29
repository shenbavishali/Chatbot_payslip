# Payroll Chatbot Integration

## Configuration

Backend endpoint URLs are configured in `backend/config/app.yml`.

```yaml
payroll_api:
  endpoints:
    payslip: "https://sit.ebaconnect.com/api/mcp"
    pay_summary: "https://sit.ebaconnect.com/api/mcp"
```

Both chatbot payroll intents call the configured Java MCP endpoint with a JSON tool payload such as `getPayslip` or `getPaySummary`. Change these values when the Java MCP URL changes. The application code does not hardcode payroll URLs.

## iCore Embedding Without iframe

The existing iCore page should render a normal container and load the built React assets directly.

```html
<div id="root"></div>
<script>
  window.I_CORE_CHATBOT_CONTEXT = {
    employeeId: "#{sessionScope.employeeId}",
    userId: "#{sessionScope.userId}",
    companyId: "#{sessionScope.companyId}",
    sessionParams: {
      branchId: "#{sessionScope.branchId}"
    }
  };
</script>
<script type="module" src="/chatbot/assets/index.js"></script>
```

The context script must run before the chatbot bundle. The chatbot also accepts these equivalent field names:

```js
window.I_CORE_CHATBOT_CONTEXT = {
  employeeId: "1000002",        // or employeeCode, employee_id, empCode
  employeeName: "Employee Name",
  userId: "USR001",             // or user_id, loginUserId
  companyId: "J&J Marketing LLC", // or companyName, company
  sessionParams: {}
};
```

## iCore Embedding With iframe

If iCore loads the chatbot in an iframe, pass the logged-in context in the iframe URL:

```html
<iframe
  src="/chatbot/index.html?employeeId=1000002&companyId=J%26J%20Marketing%20LLC&userId=USR001"
></iframe>
```

For same-origin iframes, iCore can also set `window.I_CORE_CHATBOT_CONTEXT` on the parent window before opening the chatbot. For cross-origin iframes, use URL parameters or store the same JSON object in `sessionStorage` under `I_CORE_CHATBOT_CONTEXT` before loading the chatbot.

For JSF/PrimeFaces pages, prefer setting the iframe URL in JavaScript so values like `J&J Marketing LLC` are encoded correctly:

```xhtml
<h:outputText id="chatEmployeeId" value="#{homeUiBean.personnelLite.externalId}" styleClass="hidden" />
<h:outputText id="chatEmployeeName" value="#{homeUiBean.personnelLite.displayName}" styleClass="hidden" />
<h:outputText id="chatCompanyName" value="#{userPreferencesUiBean.getLoggedCompanyName()}" styleClass="hidden" />

<p:commandButton
    id="cbOpenChat"
    icon="pi pi-comments"
    onclick="openIcoreChatbot(); return false;"
    style="position:fixed;bottom:18px;right:18px;z-index:10;border-radius:50%;width:40px;height:40px;" />

<p:dialog id="dChat" widgetVar="wvdChat" header="Chat" modal="true"
          resizable="false" draggable="false" width="1250" height="820" appendTo="@form">
    <iframe id="icoreChatbotFrame" width="100%" height="760" style="border:none;"></iframe>
</p:dialog>

<h:outputScript target="body">
function readTextById(id) {
  var element = document.getElementById(id);
  return element ? element.textContent.trim() : "";
}

function openIcoreChatbot() {
  var frame = document.getElementById("icoreChatbotFrame");
  var context = {
    employeeCode: readTextById("#{p:component('chatEmployeeId')}"),
    employeeName: readTextById("#{p:component('chatEmployeeName')}"),
    companyId: readTextById("#{p:component('chatCompanyName')}"),
    sessionParams: {}
  };

  if (!context.employeeCode || context.employeeCode === "null") {
    alert("Employee code is missing. Please check homeUiBean.personnelLite.externalId.");
    return;
  }

  frame.onload = function() {
    frame.contentWindow.postMessage(
      { type: "I_CORE_CHATBOT_CONTEXT", context: context },
      "http://localhost:5173"
    );
  };

  frame.src = "http://localhost:5173/?context=" + encodeURIComponent(JSON.stringify(context));

  PF("wvdChat").show();
}
</h:outputScript>
```

## JSF + PrimeFaces Example

### Managed Bean

Expose the logged-in employee context from the JSF managed bean:

```java
import jakarta.enterprise.context.ViewScoped;
import jakarta.inject.Named;
import java.io.Serializable;

@Named("folderDocumentBean")
@ViewScoped
public class FolderDocumentBean implements Serializable {

    public String getLoggedInEmployeeCode() {
        return sessionBean.getEmployeeCode();
    }

    public String getLoggedInEmployeeName() {
        return sessionBean.getEmployeeName();
    }

    public String getLoggedInCompanyName() {
        return sessionBean.getCompanyName();
    }

    public String getLoggedInUserId() {
        return sessionBean.getUserId();
    }
}
```

Replace `sessionBean` with the actual iCore session/user bean used by the folder and document page.

### JSF Page

Add the chatbot button and dialog to the JSF page:

```xhtml
<p:commandButton
    type="button"
    value="Chatbot"
    icon="pi pi-comments"
    onclick="openPayrollChatbot(); return false;" />

<p:dialog
    widgetVar="payrollChatbotDialog"
    header="Chat"
    modal="true"
    resizable="false"
    width="1250"
    height="820"
    appendTo="@(body)">

    <div
        id="payroll-chatbot-root"
        data-chatbot-root="true"
        data-employee-id="#{folderDocumentBean.loggedInEmployeeCode}"
        data-employee-name="#{folderDocumentBean.loggedInEmployeeName}"
        data-company-id="#{folderDocumentBean.loggedInCompanyName}"
        data-user-id="#{folderDocumentBean.loggedInUserId}">
    </div>
</p:dialog>
```

### JavaScript Context Injection

The `data-*` attributes above are the preferred JSF integration because they are rendered with the page and survive normal dialog open/close behavior. You can also inject the same values into `window.I_CORE_CHATBOT_CONTEXT` before opening the chatbot:

```xhtml
<h:outputScript target="body">
function openPayrollChatbot() {
  window.I_CORE_CHATBOT_CONTEXT = {
    employeeId: "#{folderDocumentBean.loggedInEmployeeCode}",
    employeeName: "#{folderDocumentBean.loggedInEmployeeName}",
    companyId: "#{folderDocumentBean.loggedInCompanyName}",
    userId: "#{folderDocumentBean.loggedInUserId}",
    sessionParams: {}
  };

  PF("payrollChatbotDialog").show();
}
</h:outputScript>
```

Load the built React chatbot bundle after the context-capable page markup:

```xhtml
<h:outputStylesheet name="chatbot/assets/index-3490WxeQ.css" />
<h:outputScript name="chatbot/assets/index-DSOcAnx9.js" type="module" target="body" />
```

If your React root id is different, update `frontend/index.html` and `frontend/src/main.tsx` to mount to the same element used in the JSF page.

### React Context Reader

The React app reads the injected object and normalizes common JSF/iCore field names:

```ts
const context = window.I_CORE_CHATBOT_CONTEXT;

const requestPayload = {
  message: text,
  context: {
    employee_id: context.employeeCode ?? context.externalId ?? context.employeeId,
    employee_name: context.employeeName,
    user_id: context.userId,
    company_id: context.companyId,
    session_params: context.sessionParams ?? {},
  },
};
```

For Java MCP methods that call `getPersonnelId(companyId, employee)`, pass the employee code/external id. Do not pass the employee display name, because the Java API will return `Invalid Employee Code`.

### Backend Payload

The React app sends this payload to FastAPI:

```json
{
  "message": "how to get my payslip?",
  "context": {
    "employee_id": "1000002",
    "employee_name": "John Mathew",
    "user_id": "USR001",
    "company_id": "J&J Marketing LLC",
    "session_params": {}
  }
}
```

FastAPI then calls the Java MCP API. For payslip:

```json
{
  "tool": "getPayslip",
  "args": {
    "employee": "1000002",
    "userId": "USR001",
    "company": "J&J Marketing LLC",
    "month": "APR",
    "year": "2025"
  }
}
```

For pay summary:

```json
{
  "tool": "getPaySummary",
  "args": {
    "company": "J&J Marketing LLC",
    "employee": "1000002",
    "year": "2025"
  }
}
```

For a production build, run `npm run build` inside `frontend` and serve `frontend/dist` from the existing application or a static asset path that iCore can include.

## Runtime Flow

1. iCore authenticates the user.
2. iCore injects employee, user, company, and available session or bean values into `window.I_CORE_CHATBOT_CONTEXT`.
3. React sends the chat message and context to FastAPI.
4. FastAPI detects whether the user asked for payslip or pay summary.
5. FastAPI calls the configured Java MCP endpoint using the passed employee context.
6. The result is returned to the chatbot and logged in MySQL.
