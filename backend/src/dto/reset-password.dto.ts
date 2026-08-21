import { IsEmail , IsNotEmpty, IsString, MinLength, MaxLength} from "class-validator";

export class ResetPasswordDto {
   
    @IsEmail()  @IsNotEmpty() @IsString() @MinLength(3) @MaxLength(40)
    "Email": string;

    @IsNotEmpty() @IsString() 
    // @MinLength(8) @MaxLength(128)
    "Password": string;
}

