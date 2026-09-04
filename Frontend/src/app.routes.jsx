import {createBrowserRouter, Navigate} from "react-router";
import Login from "./features/auth/pages/Login"
import Home from "./features/interview/pages/Home"
import Register from "./features/auth/pages/Register"
import Protected from "./features/auth/components/Protected";
import Interview from "./features/interview/pages/Interview";


export const router= createBrowserRouter([
    {
        path: '/login',
        element: <Login />
    },
    {
        path: '/register',
        element: <Register />
    },
    {
        path: '/',
        element: <Protected><Login /></Protected>
    },
    {
        path: '/home',
        element: <Protected><Home /></Protected>
    },
    {
        path: '/interview/:interviewId',
        element: <Protected><Interview /></Protected>
    }
])