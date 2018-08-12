require('./config/config')

const express=require('express');
const bodyParser=require('body-parser');
const {ObjectID}=require('mongodb');
const _=require('lodash');

const port=process.env.PORT || 3000;

let {mongoose}=require("./db/mongoose");
let {Todo}=require("./models/todo");
let {User}=require("./models/user");
let {authenticate}=require('./middleware/authenticate');

const app=express();

app.use(bodyParser.json());

app.post('/todos',authenticate,(req,res)=>{
    let newTodo=new Todo({
        text: req.body.text,
        _creator: req.user._id
    });
    newTodo.save().then((doc)=>{
        res.send(doc);
    },(err)=>{
        res.status(400).send(err);
    });
});

app.get('/todos',authenticate,(req,res)=>{
    Todo.find({_creator:req.user._id}).then((todos)=>{
        res.send({todos});
    },(er)=>{
        res.status(400).send(er);
    });
});

app.get('/todos/:id',authenticate,(req,res)=>{
    let id=req.params.id;
    if(!ObjectID.isValid(id)){return res.status(404).send()};

    Todo.findOne({
        _id:id,
        _creator:req.user._id
    }).then((doc)=>{
        if(!doc){return res.status(404).send()}

        return res.send({doc});

    }).catch((e)=>{
        return res.send(e);
    })
});

app.delete('/todos/:id',authenticate,(req,res)=>{
    let {id}=req.params;
    if(!ObjectID.isValid(id)){return res.status(404).send()};

    Todo.findOneAndRemove({
        _id:id,
        _creator:req.user._id
    }).then((docs)=>{
        if(!docs){return res.status(404).send()}

        return res.send({docs});
    }).catch((e)=>{
        return res.send(e);
    })
});

app.patch('/todos/:id',authenticate,(req,res)=>{
    let {id}=req.params;
    let body=_.pick(req.body,['text','completed']);
    if(!ObjectID.isValid(id)){return res.status(404).send()};

    if(_.isBoolean(body.completed)  && body.completed){
        body.completedAt=new Date().getTime();
    }else{
        body.completed=false;
        body.completedAt=null;
    }

    Todo.findOneAndUpdate({_id:id,_creator:req.user._id},{$set:body},{new:true}).then((doc)=>{
        if(!doc){return res.status(404).send()};
        res.send({doc});
    }).catch((err)=>{
        res.status(400).send();
    });
});

app.post('/users',(req,res)=>{
    let body=_.pick(req.body,['email','password']);
    let user=new User(body);
    
    user.save().then(()=>{
        return user.getAuthToken();
    }).then((token)=>{
        res.header('x-auth',token).send(user);
    }).catch((err)=>{
        res.status(404).send(err);
    });
});

app.get('/users/me',authenticate,(req,res)=>{
    res.send(req.user);
});

app.post('/users/login',(req,res)=>{
    let body=_.pick(req.body,['email','password'])
    User.findByCredentials(body.email,body.password).then((user)=>{
        return user.getAuthToken().then((token)=>{
            res.header('x-auth',token).send(user);
        });
    }).catch((e)=>{
        res.status(400).send()
    });
});

app.delete('/users/logout',authenticate,(req,res)=>{
    req.user.removeToken(req.token).then((user)=>{
        res.status(200).send();
    }).catch((e)=>{
        res.status(400).send();
    });
});


app.listen(port,()=>{
    console.log(`Connected to localhost:${port}`);
});

module.exports={app};