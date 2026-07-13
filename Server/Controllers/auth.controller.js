import { genToken } from "../Configs/token.js"
import User from "../Models/user.model.js"



export const googleAuth = async (req,res) => {
    try {
        const {name , email} = req.body
        if(!name || !email) {
            return res.status(400).json({message:"Name and Email are required"})
        }
        let user = await User.findOne({email})
        if(!user){
            user = await User.create({
                name , email
            })
        }
        const token = await genToken(user._id)
        // Cookie options: use secure+SameSite=None in production (requires HTTPS).
        // For local development (http://localhost) use SameSite='lax' and secure=false so browsers accept the cookie.
        const isProd = process.env.NODE_ENV === 'production'
        const cookieOptions = {
            httpOnly: true,
            secure: isProd, // true in prod (HTTPS), false in dev (localhost)
            sameSite: isProd ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        }

        res.cookie("token", token, cookieOptions)

        return res.status(200).json(user)

    } catch (error) {
        return res.status(500).json({message:`Google auth error ${error}`})
    }
}

export const logOut = async (req,res) => {
    try {
        const isProd = process.env.NODE_ENV === 'production'
        await res.clearCookie("token", {
            httpOnly: true,
            secure: isProd,
            sameSite: isProd ? 'none' : 'lax'
        })
         return res.status(200).json({message:"LogOut Sucessfully"})
    } catch (error) {
         return res.status(500).json({message:`LogOut Failed ${error}`})
    }
}