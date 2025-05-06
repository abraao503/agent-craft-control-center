# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/e0282dae-bc3c-4fd6-819f-cb04da37e4af

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/e0282dae-bc3c-4fd6-819f-cb04da37e4af) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Highlight.run for error monitoring and session replay

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/e0282dae-bc3c-4fd6-819f-cb04da37e4af) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Monitoring and Error Tracking

This project uses Highlight.run for session replay and error tracking. The integration:

- Captures front-end errors and reports them to the Highlight dashboard
- Records user sessions for debugging issues in production
- Only runs in production environments (controlled by VITE_HIGHLIGHT_ENABLED)
- Includes a custom error boundary for React errors
- Tracks form validation errors with detailed context information

### Form Error Tracking

The app includes a specialized form error tracking system that:

- Captures validation errors in real-time as users interact with forms
- Reports which fields failed validation and why
- Includes contextual information about the form and page where the error occurred
- Helps identify problematic forms that users struggle with

To add error tracking to a form, wrap it with the `FormErrorTracker` component:

```tsx
<FormErrorTracker 
  form={form}
  formId="your-form-id" 
  formName="Human Readable Form Name"
  contextInfo={{ /* additional context */ }}
>
  <Form {...form}>
    {/* Your form fields */}
  </Form>
</FormErrorTracker>
```

To access the Highlight dashboard, visit [app.highlight.io](https://app.highlight.io) and use the project ID: `mem5yojg`.

For local development, Highlight is disabled by default. You can enable it by setting `VITE_HIGHLIGHT_ENABLED=true` in your `.env.development` file.
