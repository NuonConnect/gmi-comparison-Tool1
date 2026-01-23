// Netlify Identity Signup Trigger
// This function runs automatically when a user signs up
// It assigns 'admin' role to specific email addresses

// Add admin emails here
const ADMIN_EMAILS = [
  'it2@nsib.ae',
  'bp1@nsib.ae',
  
  // Add more admin emails as needed
];

export const handler = async (event) => {
  const data = JSON.parse(event.body);
  const { user } = data;

  // Check if the user's email is in the admin list
  const isAdmin = ADMIN_EMAILS.some(
    email => email.toLowerCase() === user.email.toLowerCase()
  );

  if (isAdmin) {
    return {
      statusCode: 200,
      body: JSON.stringify({
        app_metadata: {
          roles: ['admin']
        },
        user_metadata: {
          ...user.user_metadata
        }
      })
    };
  }

  // Regular user - no special roles
  return {
    statusCode: 200,
    body: JSON.stringify({
      app_metadata: {
        roles: ['user']
      },
      user_metadata: {
        ...user.user_metadata
      }
    })
  };
};