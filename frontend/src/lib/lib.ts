import { UserType } from "../types/UserTypes/UserTypes";
import { TranslationTypes } from "../types/StoreTypes/StoreTypes";

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

    patchRequest: async (url: string, body: Object) => {
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

    putRequest: async (url: string, body: Object) => {
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
    getLanguage: async (key : string | null) : Promise<TranslationTypes> => {
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

export const language : TranslationTypes = {
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
        }
    };