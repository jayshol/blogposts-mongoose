'use strict'

const express = require('express');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const {PORT, DATABASE_URL} = require('./config');
const {BlogPost} = require('./models');

const app = express();
app.use(express.json());

app.get('/blog-posts', (req, res) => {
	BlogPost
	.find()
	.then(blogposts => {
		res.json({
			blogposts: blogposts.map((blogpost) => {
				return blogpost.serialize();
			})
		});
	})
	.catch(err => {
		console.error(err);
		res.status(500).json({message: 'Internal server error'});
	});
});

app.get('/blog-posts/:id', (req, res) => {
	BlogPost
	.findById(req.params.id)
	.then(blogpost => res.json(blogpost.serialize()))
	.catch(err => {
		console.err(err);
		res.status(500).json({message: 'Internal server error'});
	});
});

app.post('/blog-posts', (req, res) => {
	const requiredFields = ["title","content","author"];
	for(let i=0;i<requiredFields.length;i++){
		const field = requiredFields[i];
		if(!(field in req.body)){
			const message = `Missing \`${field}\` in request body`;
			console.error(message);
			return res.status(400).send(message);
		}
	}

	BlogPost
	.create({
		title: req.body.title,
		content : req.body.content,
		author:req.body.author,
		created: Date.now()
	})
	.then(blogpost => res.status(201).json(blogpost.serialize()))
	.catch(err => {
		console.error(err);
		res.status(500).json({message: 'Internal server error'});
	});
});

app.put('/blog-posts/:id', (req, res) => {
	if(!(req.params.id && req.body.id && req.params.id === req.body.id)) {
		const message = (
			`Request path id (${req.params.id}') and request body id ` +
			`(${req.body.id}) must match`);
		console.error(message);
		return res.status(400).json({message: message});
	}

	const toUpdate = {};
	const updateableFields = ['title', 'content','author'];

	updateableFields.forEach(field => {
		if(field in req.body) {
			toUpdate[field] = req.body[field];
		}
	});

	BlogPost
	.findByIdAndUpdate(req.params.id, {$set: toUpdate})
	.then(blogpost => res.status(204).end())
	.catch(err => res.status(500).json({message: 'Internal server error'}));
});

app.delete('/blog-posts/:id', (req, res) => {
	BlogPost
	.findByIdAndRemove(req.params.id)
	.then(blogpost => res.status(204).end())
	.catch(err =>res.status(500).json({message: 'Internal server error'}));
});

app.use('*', function(req, res){
	res.status(404).json({message:'Not Found'});
});

let server;

function runServer(database_url, port = PORT ){

	return new Promise((resolve, reject) => {
		mongoose.connect(database_url, err => {
			if(err){
				return reject(err);
			}

			server = app.listen(port, () => {
				console.log(`Your app is listening on port ${port}`);
				resolve();
			})
			.on('error', err => {
				mongoose.disconnect();
				reject(err);
			});
		});
	});

}

function closeServer(){
	return mongoose.disconnect().then(() => {
		return new Promise((resolve, reject) => {
			console.log('Closing server');
			server.close(err => {
				if(err){
					return reject(err);
				}
				resolve();
			});
		});
	});
}

if(require.main === module){
	runServer(DATABASE_URL).catch(err => console.error(err));
}

module.exports = {app, runServer, closeServer};