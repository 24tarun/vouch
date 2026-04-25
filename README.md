# Vouch



## Run Trigger.dev (Background Jobs)

To test background jobs (like task reminders and deadline warnings) locally:

1.  Login to Trigger.dev CLI:
    ```bash
    npx trigger.dev@latest login
    ```
2.  Run the dev command to forward runs to your local machine:
    ```bash
    npx trigger.dev@latest dev
    ```

This will start a tunnel and allow your local Trigger.dev tasks to execute.

## 6. Deploying Trigger.dev Tasks to Production

When you make changes to trigger files (`src/trigger/*`) or environment variables:

### Deploy Tasks

```bash
npx trigger.dev@latest deploy
```



