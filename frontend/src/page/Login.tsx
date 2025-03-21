import LoadingSpinner from "@/components/common/LoadingSpinner"
import InputPassword from "@/components/common/PasswordInput"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import axiosFetch from "@/lib/axios"
import handleValidationError from "@/lib/handleValidationError"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import toast from "react-hot-toast"
import { Link, useSearchParams } from "react-router-dom"
import { z } from "zod"

const formSchema = z.object({
    email: z.string().email({
        message: "Please enter a valid email address",
    }),
    password: z.string()
})

const Login = () => {
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema)
    });

    const next = searchParams.get('next');

    const onSubmit = async (data: z.infer<typeof formSchema>) => {
        setIsLoading(true)
        try {
            const response = await axiosFetch.post("/auth/login/local", {
                ...data,
                rememberMe
            })

            if(response.status === 400) {
                // handle when it's not a validation exception
                handleValidationError(response, response.data.errors, form.setError)

                return
            }

            if(response.status >= 401) {
                toast.error(response.data.message)
            }

            // save the access_token
            response.data.refresh_token && localStorage.setItem("refresh_token", response.data.refresh_token)
            localStorage.setItem("access_token", response.data.access_token)
            toast.success("Login successful")

            //redirect
            window.location.assign(next || "/")
        } catch (error) {
            toast.error("An error occurred. Please try again later.")
        } finally {
            setIsLoading(false)
        }
    }

    const OauthLogin = async (url: string) => {
        setIsGoogleLoading(true) // might want tochange this if we add more oauth
        if(next) {
            sessionStorage.setItem('next', next)
        }

        window.location.href = url;
    }

    return (
        <div className="w-full h-screen flex justify-center items-center">
            <Card className="w-[400px]">
                <CardHeader>
                    <CardTitle>
                        Login
                    </CardTitle>
                    <CardDescription>
                        Login to your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
                            <FormField 
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input placeholder="example@gmail.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                            />
                            <FormField 
                            control={form.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <InputPassword {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                            />
                            <div className="flex justify-between">
                                <div className="flex items-center space-x-2">
                                    <Checkbox onCheckedChange={() => setRememberMe((prev) => !prev)} checked={rememberMe} id="remember" className="border-muted-foreground" />
                                    <Label htmlFor="remember" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50">
                                        Remember me
                                    </Label>
                                </div>
                                <Link to="/forgot-password" className="text-sm text-primary underline-offset-2 hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                            <Button disabled={isLoading} type="submit" className="w-full mt-3">
                                {isLoading ? <LoadingSpinner /> : "Login"}
                            </Button>
                            <Button disabled={isGoogleLoading} onClick={() => OauthLogin(import.meta.env.VITE_BACKEND_URL + "/auth/google-login")} type="button" variant={"outline"} className="w-full">
                                {isGoogleLoading ? <LoadingSpinner /> : 
                                    <>
                                        <img src="/google.svg" className="w-5 h-5" />
                                        Log in with Google
                                    </>
                                }
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter>
                    <div className="flex text-sm space-x-1 justify-center w-full">
                        <p>Don't have an account?</p>
                        <Link to="/signup" className="font-medium text-primary underline-offset-2 hover:underline">
                            Sign up
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}

export default Login