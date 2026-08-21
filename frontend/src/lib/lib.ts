
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
