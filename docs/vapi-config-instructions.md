# Vapi Configuration Instructions for Computer Use Agent

**Objective:**
Log into the Vapi Dashboard and configure the Assistant to use the correct Server URL and Tool Definitions so it can interact with the local task management system.

**Prerequisites:**

1.  **Ngrok URL**: You must have the active ngrok URL ready (e.g., `https://xxxx-xxxx.ngrok-free.app`).
2.  **Vapi Login**: You must be logged into [dashboard.vapi.ai](https://dashboard.vapi.ai).

## Step 1: Navigate to Assistant Settings

- Go to the **Assistants** tab.
- Select the assistant named **"Vibe Planning"** (or create it if it doesn't exist).

## Step 2: Configure Server URL

- Find the **Server URL** field.
- Set it to: `https://ca1a414f2b62.ngrok-free.app/api/vapi/webhook`
- **Crucial**: Ensure there are no trailing spaces.

## Step 3: Configure Tools (Function Calling)

- Locate the **Tools** or **Functions** section.
- Remove any existing tools to start fresh.
- Add the following **4 Tools** exactly as defined below:

### Tool 1: createTask

- **Name**: `createTask`
- **Description**: Create a new task in the user's inbox.
- **Parameters (JSON Schema)**:
  ```json
  {
    "type": "object",
    "properties": {
      "title": {
        "type": "string",
        "description": "The content/title of the task"
      },
      "priority": {
        "type": "string",
        "enum": ["high", "medium", "low"],
        "description": "Priority level (default: medium)"
      },
      "category": {
        "type": "string",
        "description": "Category like work, personal, home"
      },
      "due": {
        "type": "string",
        "description": "Due date in natural language (e.g., 'tomorrow at 5pm')"
      }
    },
    "required": ["title"]
  }
  ```

### Tool 2: listTasks

- **Name**: `listTasks`
- **Description**: List active or completed tasks.
- **Parameters (JSON Schema)**:
  ```json
  {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "enum": ["active", "completed", "someday"],
        "description": "Status of tasks to list (default: active)"
      },
      "limit": {
        "type": "number",
        "description": "Number of tasks to return (default: 5)"
      }
    }
  }
  ```

### Tool 3: completeTask

- **Name**: `completeTask`
- **Description**: Mark a task as completed.
- **Parameters (JSON Schema)**:
  ```json
  {
    "type": "object",
    "properties": {
      "taskId": {
        "type": "string",
        "description": "The exact ID of the task (e.g., task-123...)"
      },
      "title": {
        "type": "string",
        "description": "The title of the task if ID is unknown (fuzzy match)"
      }
    },
    "required": ["taskId"]
  }
  ```

### Tool 4: getTaskSummary

- **Name**: `getTaskSummary`
- **Description**: Get a high-level summary of tasks, priorities, and deadlines.
- **Parameters (JSON Schema)**:
  ```json
  {
    "type": "object",
    "properties": {}
  }
  ```

## Step 4: Save & Publish

- Click **Save** or **Publish** to apply changes.

## Step 5: Verification

- Confirm the **Server URL** is correct.
- Confirm all **4 tools** are listed with correct names.
