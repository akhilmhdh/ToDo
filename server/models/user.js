const mongoose=require('mongoose')
const validator=require('validator')
const jwt=require('jsonwebtoken')
const _=require('lodash')
const bcrypt=require('bcryptjs')
let UsersSchema=new mongoose.Schema({
    email:{
        type:String,
        trim:true,
        minlength:1,
        required:true,
        unique:true,
        validate:{
            validator:validator.isEmail,
            message:`{VALUE} is not a valid email`
        }
    },  
    password:{
        type:String,
        trim:true,
        minlength:6,
        required:true
    },
    tokens:[{
        access:{
            type:String,
            required:true   
        },
        token:{
            type:String,
            required:true   
        }
    }]
    });
UsersSchema.methods.toJSON=function(){
    let user=this;
    let userObject=user.toObject();
    return _.pick(userObject,['_id','email']);
};

UsersSchema.methods.getAuthToken=function(){
    let user=this;
    let access='auth';
    let token=jwt.sign({_id:user._id.toHexString(),access},process.env.JWT_SECRET).toString();
    user.tokens.push({access,token});
    return user.save().then(()=>{
        return token;
    });
};

UsersSchema.statics.findByToken=function(token){
    let User=this;
    let decode;
    try{
        decode=jwt.verify(token,'abc123');
    }catch(e){
        return Promise.reject();
    }
    return User.findOne({
        '_id':decode._id,
        'tokens.token':token,
        'tokens.access':'auth'
    });

};

UsersSchema.pre('save',function(next){
    let user=this;
    if(user.isModified('password')){
        bcrypt.genSalt(15,(err,salt)=>{
            bcrypt.hash(user.password,salt,(err,hash)=>{
                user.password=hash;
                next();
            });
        });
    }else{
        next();
    }
});

UsersSchema.statics.findByCredentials=function(email,password){
    let User=this;
    return User.findOne({email}).then((user)=>{
        if(!user){
            return Promise.reject();
        }
        return new Promise((resolve,reject)=>{
            bcrypt.compare(password,user.password,(err,res)=>{
                if(res){
                    resolve(user);
                }else{
                    reject();
                }
            });
        });
    });
};

UsersSchema.methods.removeToken=function(token){
    let user=this;
    
    return user.update({
        $pull:{
        tokens:{token}
        }
    });
};

let User=mongoose.model('users',UsersSchema);

module.exports={User};