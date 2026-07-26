import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    signup(signupDto: SignupDto): Promise<{
        token: string;
        organizer: {
            id: string;
            name: string;
            email: string;
        };
    }>;
    login(loginDto: LoginDto): Promise<{
        token: string;
        organizer: {
            id: string;
            name: string;
            email: string;
        };
    }>;
    getProfile(req: any): Promise<{
        organizer: any;
    }>;
}
