import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class codeDto {
    @IsNumber()  @IsNotEmpty()
    "userId": number;
    
    @IsString()  @IsNotEmpty()
    "Password": string;

    @IsString()  @IsNotEmpty()
    "code" : string;
}
