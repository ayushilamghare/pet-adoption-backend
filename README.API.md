# 🐾 Adoptly API Routes

| Method | Endpoint | Description | Auth / Role Requirement |
|:---|:---|:---|:---|
| **Auth** | | | |
| POST | `/api/auth/register` | Register a new user | Public |
| POST | `/api/auth/login` | Authenticate and get JWT | Public |
| **Pets** | | | |
| GET | `/api/pets` | List all pets | Public |
| GET | `/api/pets/:id` | Get details of a single pet | Public |
| POST | `/api/pets` | Create a new pet listing | 🔒 Shelter |
| PUT | `/api/pets/:id` | Update a pet listing | 🔒 Shelter |
| DELETE | `/api/pets/:id` | Delete a pet listing | 🔒 Shelter |
| **Applications**| | | |
| POST | `/api/applications` | Apply to adopt or foster a pet | 🔒 Adopter / Foster |
| GET | `/api/applications/my` | View my submitted applications | 🔒 Adopter / Foster |
| GET | `/api/applications/shelter` | View applications sent to shelter | 🔒 Shelter |
| PUT | `/api/applications/:id` | Update application status | 🔒 Shelter |
| **Messages** | | | |
| POST | `/api/messages` | Send a direct message | 🔒 Any User |
| GET | `/api/messages/conversations`| List all active conversation threads | 🔒 Any User |
| GET | `/api/messages/:userId` | Get chat history with a specific user | 🔒 Any User |
| **Reviews** | | | |
| POST | `/api/reviews` | Write a review for a pet | 🔒 Adopter / Foster |
| GET | `/api/reviews/pet/:petId` | Get all reviews for a pet | Public |
| GET | `/api/reviews/me` | View reviews I wrote | 🔒 Adopter / Foster |
| GET | `/api/reviews/shelter` | View reviews my shelter received | 🔒 Shelter |
| DELETE | `/api/reviews/:id` | Delete my review | 🔒 Any User |
| **Users** | | | |
| GET | `/api/users/me` | Get my profile details | 🔒 Any User |
| PUT | `/api/users/me` | Update my profile details | 🔒 Any User |
| GET | `/api/users/contacts` | Get my message contacts | 🔒 Any User |
| GET | `/api/users/favorites` | View my favorite pets | 🔒 Adopter |
| PUT | `/api/users/favorites/:petId`| Add pet to favorites | 🔒 Adopter |
| DELETE | `/api/users/favorites/:petId`| Remove pet from favorites | 🔒 Adopter |
