import { UserType } from "../types/UserTypes/UserTypes";
import { TranslationType } from "../types/StoreTypes/StoreTypes";

export const Lib = {
    
    postRequest: async (url: string, obj: object) => {
       try {
            const res = await fetch(url,  {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify (obj)
            })
            return res;
       }
       catch {
            throw new Error();
       }
    },

    patchRequest: async (url: string, body: object) => {
        try {
            return  await fetch(url, {
                method: "PATCH",
                headers: {
                    "Content-type": "application/json",
                },
                body: JSON.stringify(body),
            });

        } catch { throw new Error() }
    },

    putRequest: async (url: string, body: object) => {
        try {
            return  await fetch(url, {
                method: "PUT",
                headers: {
                    "Content-type": "application/json",
                },
                body: JSON.stringify(body),
            });

        } catch { throw new Error() }
    },
    getUser: async (accessToken: string | undefined) : Promise<UserType | null> => {
        if (accessToken === undefined) return null;
        try{
            const res = await fetch(`${process.env.INTERNAL_API_URL}/users/me`,  {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                },
            });
            if (res.ok)
            {
                return await res.json();
            }
            return null;
        }
        catch {return null }
    },
    getLanguage: async (key : string | null) : Promise<TranslationType> => {
        if (key === null) return language;
        try {
                const res = await fetch(`${process.env.INTERNAL_API_URL}/users/language/${key}`);
                if (res.ok)
                    return  await res.json();
                return language;
        }
        catch { return language}
    },
    data:
    [
        {
            id: "1",
            type: "text",
            name: "Username",
            src : "/png/users.png",
            value: "",
            bol: true,
        },
        {
            id: "2",
            type: "email",
            name: "Email",
            src : "/png/email.png",
            value: "",
            bol: true,
        },
        {
            id: "3",
            type: "password",
            name: "Password",
            src : "/png/secret.png",
            value: "",
            bol: true,
        },
        {
            id: '4',
            type: "password",
            name: "ConfirmPassword",
            src : "/png/secret.png",
            value: "",
            bol: true,
        }
    ],
}

export const language : TranslationType = {
        "Header": {
            "a":"Arena",
            "f":"Friends",
            "plaseholder": "players",
            "invite": "Envite",
            "si":"Sign In",
            "su":"Sign Up"
        },
        "HomePage": {
            "title":"BUILT FOR REAL-TIME COMBAT",
            "choice": "Pick how you'd like to pla",
            "motoFirst":"SLITHER.STRIKE.",
            "motoSecond":"SURVIVE.",
            "description":"A multiplayer snake battleground where four serpents enter, one slithers out. Real-time. Cross-platform. No mercy.",
            "sBtn": "Start Playing",
            "cards": [
                {
                    "title": "vs AI",
                    "description": "Quick solo match. No waiting.",
                    "button": "Start match",
                    "wait": "Instant",
                    "mode": "AI",
                },
                {
                    "title": "Quick Match",
                    "description": "Online matchmaking, balanced by rating.",
                    "button": "Find match",
                    "wait": "avg. wait ~8s",
                    "mode": "online"  ,
                },
            ]
        },
        "Profile": {
            "language" : ["en", "de", "it", "ru"],
            "epBtn": "edit profile",
            "sub": "submit",
            "preferences": "Preferences",
            "settings": {
                "lang": "Language",
                "ct": "Color theme",
                "da": "Delete account",
                "lo": "Logout",
                "sound" : "Sound & music",
                "message" : "The request could not be completed",
                "avatar" : "Avatar",
                "snakeColor" : "Snake color",
                "username" : {
                    "label" : "Username",
                    "edit" : "Edit"
                },
                "account" : {
                    "yes" : "Yes",
                    "no" : "No",
                    "text": "Are you sure you want to delete your account?",
                    "account" : "Account",
                    
                },
                "secure": {
                    "label1": "Secure",
                    "label2": "change password, 2FA",
                    "changePassword" : "Change",
                    "close" : "Close",
                    newPassword: "New Passwort",
                    oldPassword: "Old Passwort",
                }
            }
        },
        "Arena": {
            "header" : {
                "match" : "Live Match · Room",
                "time" : "Time",
                "players" : "Players",
                "score" : "Your Score",
                "difficulty" : "Difficulty",
                "copy" : "Copy room ID",
                "copied" : "Copied",
            },
            "saidBar" : {
                    "onlinePlayers" : "ONLINE PLAYERS",
                    "online" : "online",
                    "invited" : "Invited",
                    "position": {
                        "your" : "Your",
                        "of" : "of",
                        "position" : "Position",
                            "join" : "Join",
                            "ignore" : "Ignore"
                    }
            },
            "invite" : {
                "title" : "Match Invite",
                "subtitle" : "invited you to a match"
            },
            "board" : {
                "WAITING" : "Waiting",
                "PLAYING" : "Playing",
                "STARTING" : "Starting",
                "FINISHED" : "Finished",
                "connecting" : "Searching for a room...",
            },
            "control" : {
                "move" : "Move",
                "pause" : "Pause"
            },
            "overlay": {
                "win": "You Win!",
                "over": "Game Over",
                "tryAgain": "Try Again"
            }
        },
        "History" : {
            "you" : "you",
            "won" : "Won",
            "los" : "Los",
            "pts" : "Pts"
        },
        "Admin": {
            "title": "Admin Panel",
            "searchPlaceholder": "Search by name or email",
            "searching": "Searching...",
            "search": "Search",
            "noUsersFound": "No users found.",
            "viewEdit": "View/Edit",
            "loadingUser": "Loading user...",
            "edit": "Edit",
            "errors": {
                "forbidden": "Forbidden",
                "loadUsersFailed": "Failed to load users",
                "loadUserFailed": "Failed to load user"
            },
            "form": {
                "username": "Username",
                "email": "Email",
                    "password" : "Password",
                "newPassword": "Password (leave blank to keep unchanged)",
                "role": "Role",
                "cannotChangeOwnRole": "You cannot change your own role",
                "save": "Save",
                "saving": "Saving...",
                "cancel": "Cancel",
                "delete": "Delete",
                "deleteConfirmText": "Delete this user permanently? This cannot be undone.",
                "yesDelete": "Yes, delete",
                "deleting": "Deleting...",
                "no": "No",
                "errors": {
                    "forbidden": "Forbidden",
                    "saveFailed": "Failed to save changes",
                    "deleteFailed": "Failed to delete user"
                }
            }
        },
        contact: {
            contact: "Contact",
            send: "Send",
            title: "Send a message to administration",
            des: "Write your message here...",
            invites: "Pending Invites",
        },
        Friends: {
            social: "Social",
            friends: "Friend",
            pending: "PENDING",
            accept: "ACCEPT",
            reject: "REJECT",
            delete: "DELETE",
            empty: "No friends yet",
            cancel: "Cencel"
        },
        Footer: {
            rights: "All rights reserved.",
            privacy: "Privacy Policy",
            terms: "Terms of Service",
        },
        Legal: {
            privacyPolicy: {
                title: "Privacy Policy",
                updated: "Last updated: August 24, 2026",
                intro: "Snake (“the Project”, “we”, “us”) is a real-time multiplayer game built as an educational project for the 42 curriculum (ft_transcendence). This policy explains what data we collect when you use the application, why we collect it, and what choices you have.",
                sections: [
                    {
                        heading: "1. Information we collect",
                        items: [
                            { label: "Account data:", text: "email address, username, and a salted & hashed password (if you register with email/password)." },
                            { label: "OAuth data:", text: "if you sign in with Google or GitHub, we receive your provider account ID and the basic profile information (name, email, avatar) that provider shares with us." },
                            { label: "Gameplay data:", text: "match results, scores, wins/losses, game rooms you join, and your friends list." },
                            { label: "Preferences:", text: "chosen language, light/dark theme, avatar, and snake color." },
                            { label: "Session data:", text: "short-lived access and refresh tokens stored as HTTP-only cookies, used solely to keep you signed in." },
                            { label: "Messages you send us:", text: "content submitted through the in-app Contact form." },
                        ],
                    },
                    { heading: "2. How we use your information", text: "We use the data above to: authenticate you and keep your session secure; run matchmaking and real-time gameplay over WebSockets; show your profile, stats, match history, and online status to your friends; remember your language and theme preferences; send password-reset codes by email; and respond to messages sent through the Contact form." },
                    { heading: "3. Cookies & tokens", text: "We use two HTTP-only cookies — an access token and a refresh token — to keep you signed in across requests. These cookies are not used for advertising or cross-site tracking. Refresh tokens are stored server-side and can be revoked at any time by signing out." },
                    { heading: "4. Third-party services", text: "If you choose to sign in with Google or GitHub, that provider processes your authentication under its own privacy policy. We only receive the minimal profile information needed to create or match your account. We do not use third-party advertising or analytics trackers." },
                    { heading: "5. Sharing of information", text: "We do not sell or rent your personal data. Certain information is visible to other users as part of the core features of the app — your username, avatar, online status, and match/leaderboard results are visible to friends and, where applicable, other players in a game room." },
                    { heading: "6. Data retention & deletion", text: "We keep your account and gameplay data for as long as your account exists. You can update most of your data yourself from your profile settings. To request deletion of your account and associated data, contact us through the in-app Contact form; we will process the request within a reasonable time." },
                    { heading: "7. Security", text: "Passwords are hashed and salted before storage. All communication between your browser and our backend is encrypted with HTTPS. Access to administrative functions is restricted to accounts with the admin role." },
                    { heading: "8. Children's privacy", text: "The Project is a student software project and is not directed at children under 16. We do not knowingly collect personal data from children under that age." },
                    { heading: "9. Changes to this policy", text: "We may update this policy as the Project evolves. Material changes will be reflected by updating the “Last updated” date above." },
                    { heading: "10. Contact", text: "Questions about this policy or your data can be sent at any time through the Contact button available in the bottom-right corner of the app, or see our {link}." },
                ],
            },
            termsOfService: {
                title: "Terms of Service",
                updated: "Last updated: August 24, 2026",
                intro: "These Terms govern your use of Snake (“the Project”), a real-time multiplayer game built as an educational project for the 42 curriculum (ft_transcendence). By creating an account or using the app, you agree to these Terms.",
                sections: [
                    { heading: "1. Educational project", text: "The Project is developed by students as part of a school curriculum. It is provided for learning and demonstration purposes, not as a commercial product, and is offered “as is” without warranty of any kind." },
                    {
                        heading: "2. Your account",
                        items: [
                            { text: "You must provide accurate registration information and keep your credentials confidential." },
                            { text: "You are responsible for all activity that happens under your account." },
                            { text: "One account per person. Do not create accounts to impersonate someone else." },
                            { text: "You may delete your account at any time from your profile settings." },
                        ],
                    },
                    {
                        heading: "3. Acceptable use",
                        text: "When using the Project, you agree not to:",
                        items: [
                            { text: "Use automated scripts, bots, or exploits to gain an unfair advantage in matches (the built-in AI opponent is the only sanctioned non-human player)." },
                            { text: "Harass, abuse, or impersonate other players through profiles, friend requests, or messages." },
                            { text: "Attempt to bypass authentication, rate limits, or other security controls, or access another user's account without permission." },
                            { text: "Upload or submit unlawful, offensive, or infringing content through any part of the app." },
                        ],
                    },
                    { heading: "4. Moderation & enforcement", text: "Accounts with the administrator role may review, edit, or remove accounts that violate these Terms. We may suspend or terminate access to the Project for any account found to be in breach of section 3." },
                    { heading: "5. Content & intellectual property", text: "The Project's source code, design, and assets belong to its student authors and are used here for educational evaluation. You retain ownership of any content you submit (such as your chosen username or a message sent through the Contact form), and you grant us a limited license to store and display it as needed to operate the Project." },
                    { heading: "6. Availability", text: "As a student project, the Project may be modified, interrupted, or taken offline at any time without notice, including for evaluation or maintenance. We do not guarantee uninterrupted availability." },
                    { heading: "7. Limitation of liability", text: "To the fullest extent permitted by applicable law, the authors of the Project are not liable for any indirect, incidental, or consequential damages arising from your use of the app." },
                    { heading: "8. Changes to these Terms", text: "We may update these Terms as the Project evolves. Continued use of the app after changes are published constitutes acceptance of the revised Terms." },
                    { heading: "9. Contact", text: "Questions about these Terms can be sent through the Contact button available in the bottom-right corner of the app, or see our {link}." },
                ],
            },
        }
    };