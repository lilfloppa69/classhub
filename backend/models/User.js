import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, "Username is required"],
            unique: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: [true, "Full Name is required"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: 6,
        },
        phoneCountryCode: {
            type: String,
            enum: ["+62", "+60", "+66", "+86", "+81"],
            default: "+62"
        },

        phoneNumber: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true,
        },
        level: {
            type: Number,
            default: 1,
            min: 1,
            max: 20
        },
        xp: {
            type: Number,
            default: 0
        },
        language: {
            type: String,
            enum: ["english", "indonesian", "malay"],
            default: "english"
        },
        timezone: {
            type: String,
            enum: ["tokyo", "beijing", "jakarta", "bangkok"],
            default: "jakarta"
        },
        gender: {
            type: String,
            enum: ["male", "female", "other"],
            default: null
        },
        country: {
            type: String,
            default: ""
        },
        nickname: {
            type: String,
            default: ""
        },
        avatar: {
            type: String,
            default: ""
        },
        role: {
            type: String,
            enum: ["student", "hybrid"],
            default: "student"
        },

        stats: {

            forumPosts: {
            type: Number,
            default: 0
            },

            forumReplies: {
            type: Number,
            default: 0
            },

            forumUpvotes: {
            type: Number,
            default: 0
            },

            assignmentSubmissions: {
            type: Number,
            default: 0
            }

        },

        specialization: {
            category: {
                type: String,
                enum: ["academic", "skill", "other"],
                default: null
            },
            field: {
                type: String,
                default: ""
            }
        },

        bio: {
            type: String,
            default: ""
        },
        displayNamePreference: {
            type: String,
            enum: ["fullName", "nickname", "username"],
            default: "fullName"
        }
    },
    {
        timestamps: true,
    }
);

const User = mongoose.model("User", userSchema);

export default User;