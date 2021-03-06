const userSchemas = require('../schemas/userSchemas');
const usersRepository = require('../repository/users');
const sessionsRepository = require('../repository/sessions');
const helpers = require('../utils/helpers');

const postSignUp = async (req, res) => {
    try {
        const userParams = helpers.stripHtml(req.body);

        const { error } = userSchemas.signUp.validate(userParams);
        if (error) return res.status(422).send({ error: error.details[0].message });

        const verifyUser = await usersRepository.isEmailOrCpfUnique(userParams.email, userParams.cpf);
        if (!verifyUser) return res.status(409).send({ error: 'User is already registered'});

        const userRegistered = await usersRepository.create(userParams);
        const response = helpers.filterObject( userRegistered, ['password']);

        return res.status(201).send(response);

    } catch (error) {
        console.error(error);
        return res.sendStatus(500);
    }
}

const postSignIn = async (req, res) => {
    try {
        const userParams = helpers.stripHtml(req.body);
        
        const { error } = userSchemas.signIn.validate(userParams);
        if (error) return res.status(422).send({ error: error.details[0].message });

        const user = await usersRepository.findByEmailAndPassword(userParams);
        if(!user) return res.status(401).send({ error: 'Wrong email or password'});

        const { token } = await sessionsRepository.createByUserId(user.id);
        const userData = helpers.filterObject(user, ['password']);

        return res.status(200).send({token, ...userData});

    } catch (error) {
        console.error(error);
        return res.sendStatus(500);
    }
}

const postSignOut = async (req, res) => {
    try {
        await sessionsRepository.destroyByUserId(req.user.id);
        return res.sendStatus(200);

    } catch (error) {
        console.error(error);
        return res.sendStatus(500);
    }
}

const putTicketType = async (req, res) => {
    try {
        const { error } = userSchemas.putTicketType.validate(req.body);
        if (error) return res.status(422).send({ error: error.details[0].message });
        const { ticketType } = helpers.stripHtml(req.body);
        const { id } = req.user

        const user = await usersRepository.changeTicketType(id, ticketType);
        const response = helpers.filterObject( user, ['password']);
        res.status(200).send(response)
    } catch (error) {
        console.error(error);
        return res.sendStatus(500);
    }
}

module.exports = {
    postSignUp,
    postSignIn,
    postSignOut,
    putTicketType
}