const expect=require('expect');
const request=require('supertest');

const {app}=require('./../server');
const {Todo}=require('./../models/todo');
let {ObjectID}=require('mongodb');

const todo=[{
    _id: new  ObjectID(),
    text : 'first'
},{
    _id: new ObjectID(),
    text: 'hello',
}];
beforeEach((done)=>{
    Todo.remove({}).then(()=>{
        return Todo.insertMany(todo);
    }).then(()=>done());
}); 

describe('POST /todo',()=>{
    it('should make a req',(done)=>{
        let text="to bo completed";
        
        request(app)
        .post('/todos')
        .send({text})
        .expect(200)
        .expect((res)=>{
            expect(res.body.text).toBe(text);
        })
        .end((err,res)=>{
            if(err){return done(err)};
        Todo.find({text}).then((todo)=>{
            expect(todo.length).toBe(1);
            expect(todo[0].text).toBe(text);
            done();
        }).catch((e)=>{
            return done(e);
        })
    });
    });
});

describe("GET /todos",()=>{
    it('should make a get req',(done)=>{
        request(app)
        .get('/todos')
        .expect(200)
        .expect((res)=>{
            expect(res.body.todos.length).toBe(2);
        })
        .end(done);
    });
});

describe("GET /todos/id",()=>{
    it('should make a get req id',(done)=>{
        request(app)
        .get(`/todos/${todo[0]._id.toHexString()}`)
        .expect(200)
        .expect((res)=>{
            expect(res.body.doc.text).toBe(todo[0].text);
        })
        .end(done);
    });
    it('should make a get req obtain a 404',(done)=>{
        let hexId=new ObjectID().toHexString();
        request(app)
        .get(`/todos/&{hexId}`)
        .expect(404)
        .end(done);
    });
});

describe("DELETE /todos/id",()=>{
    it('should delete a obj for req',(done)=>{
        let hexId=todo[0]._id.toHexString();
        request(app)
        .delete(`/todos/${hexId}`)
        .expect(200)
        .expect((res)=>{
            expect(res.body.docs._id).toBe(hexId);
        })
        .end(done);
    });
});

describe('PATCH /todos/:id',()=>{
    it('should update an obj',(done)=>{
        let hexId=todo[0]._id.toHexString();
        request(app)
        .patch(`/todos/${hexId}`)
        .send({
            completed:true
        })
        .expect(200)
        .expect((res)=>{
            expect(res.body.doc.completed).toBe(true);
            expect(typeof res.body.doc.completedAt).toBe('number');
        })
        .end(done)
    });
});