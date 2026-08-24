"use client"
import { useState } from "react";
import Image from "next/image";
import { FormType } from "@/src/types/UserTypes/UserTypes";

type PropsType = { item: FormType}

export default function FormInputs ({item} :  PropsType) {

    const	[formData, setFormData] = useState<FormType>(item);
   
    return (	
            <div className="formInputDiv">

                <label htmlFor={formData.id} className="cursor-grab w-full">
                    <input  required placeholder={formData.bol ? formData.name : ""} autoComplete="true"
                        type={formData.type} name={formData.name} id={formData.id} value={formData.value} className="formInputs"
                        onFocus={ () =>  { setFormData({...formData, bol: false} ) }}
                        onChange={(e) => { setFormData({...formData, value: e.target.value })}}
                        onBlur= { () =>  { setFormData({...formData, bol: true} ) }}
                    />
                </label>
                <div className="formInputDiv">
                    <Image src={formData.src} alt="icon" id={formData.id} width={32} height={32} className="w-8  min-w-8 cursor-grab"
                        onClick={() => {
                            if (formData.name === "Password" || formData.name === "ConfirmPassword")
                            {
                                if (formData.type === "text")
                                    setFormData({...formData, type: "password", src: "/png/secret.png"}) 
                                else
                                    setFormData({...formData, type: "text", src: "/png/eye.png"});
                            }
                        }}
                    />
                </div>
            </div>
        )
}