import Link from "next/link";
import AuthButtons from "./Component/form/authbutton";
import { Next_Auth_Config } from "@/lib/auth";
import { getServerSession } from "next-auth";
import Image from "next/image";
export default async function Home() {
    const session = await getServerSession(Next_Auth_Config);
    return (
        <div className="fixed left-0 right-0 top-0 z-10 bg-blue py-5 mt-12">
            
            <div className="container mx-auto flex flex-col items-center justify-center gap-2 text-center">
                <div className="text-lg font-bold text-blue-600">Welcome to ConnectUs</div>
                <div className="text-3xl font-medium text-gray-700">Travel anywhere with <br/> ease and pocket friendly</div>
                

                <Image
                    src={'/login.jpg'}
                    alt="Travel illustration"
                    height={400}
                    width={400}
                />

                <div className="flex items-center gap-4 mt-6">
                    <AuthButtons />
                </div>
            </div>

        </div>
    );
}
