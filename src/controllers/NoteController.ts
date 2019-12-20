import { Request, Response } from 'express';
import { default as joi } from '@hapi/joi';
import { getRepository, Like } from 'typeorm';
import { Note } from '../entities/Note';

const noteSchema = joi.object({
  id: joi.number().integer(),
  title: joi.string().required(),
  content: joi.string().required(),
});

const getAllQuery = joi.object({
  order: joi
    .string()
    .uppercase()
    .valid('DESC', 'ASC')
    .required(),
  page: joi
    .number()
    .integer()
    .required(),
  limit: joi
    .number()
    .integer()
    .required(),
  sort: joi
    .string()
    .allow(''),
});

const updateNoteSchema = joi.object({
  title: joi
    .string(),
  content: joi
    .string(),
}).or('title', 'content');

class NoteController {

  async index(req: Request, res: Response) {
    type Query = {
      order: 'DESC' | 'ASC',
      page: number,
      limit: number,
      sort?: string,
    };
    const query: Query = req.query;

    const validator = getAllQuery.validate(query, { abortEarly: false });
    if (validator.error) {
      return res.status(400).json({ error: validator.error.details[0].message });
    }

    const user = req.decoded;
    const noteRep = await getRepository(Note);

    try {
      const notes = await noteRep.find({
        select: ['id', 'title', 'content', 'createdAt', 'updatedAt'],
        where: {
          userId: user.id,
          title: Like(`%${ query.sort ? query.sort : '' }%`),
        },
        order: { createdAt: <'DESC' | 'ASC'>query.order.toUpperCase() },
        take: query.limit,
        skip: query.page,
      });
      return res.status(200).json(notes);
    } catch (e) {
      return res.status(400).json({ error: 'INVALID_DATA' });
    }
  }

  async create(req: Request, res: Response) {
    const request = req.body;

    const validator = noteSchema.validate(request, { abortEarly: false });
    if (validator.error) {
      return res.status(400).json({ error: validator.error });
    }

    const user = req.decoded;
    const noteRep = await getRepository(Note);
    const note = noteRep.merge(new Note(), request);

    note.userId = user.id;
    note.ipAddress = req.clientIp;

    try {
      const newNote = await noteRep.save(note);
      return res.status(200).json({ message: 'SUCCESS', id: newNote.id });
    } catch (e) {
      return res.status(400).json({ error: 'INVALID_DATA' });
    }
  }

  async show(req: Request, res: Response) {
    const params = req.params;
    if (!params.id) {
      return res.status(400).json({ error: 'INVALID_DATA' });
    }

    const noteRep = await getRepository(Note);
    try {
      const note = await noteRep.findOne({
        select: ['id', 'title', 'content', 'createdAt', 'updatedAt'],
        where: params.id,
      });
      return res.status(200).json(note);
    } catch (e) {
      return res.status(400).json({ error: 'INVALID_DATA' });
    }
  }

  async update(req: Request, res: Response) {
    const params = req.params;
    const requst = req.body;

    // Make sure they've specified a note
    if (!params.id) {
      return res.status(400).json({ error: 'INVALID_DATA' });
    }

    const validator = updateNoteSchema.validate(requst, { abortEarly: false });
    if (validator.error) {
      return res.status(400).json({ error: validator.error.details[0].message });
    }

    // Find and set that note
    const noteRep = await getRepository(Note);
    let note = await noteRep.findOne(params.id);
    if (!note) {
      return res.status(404).json({ error: 'INVALID_DATA' });
    }

    const user = req.decoded;
    if (note.userId !== user.id) {
      return res.status(404).json({ error: 'INVALID_DATA' });
    }

    note.ipAddress = req.clientIp;
    note = noteRep.merge(note, requst);

    try {
      await noteRep.save(note);
      return res.status(200).json({ message: 'SUCCESS' });
    } catch (e) {
      return res.status(400).json({ error: 'INVALID_DATA' });
    }
  }

  async delete(req: Request, res: Response) {
    const params = req.params;
    if (!params.id) {
      return res.status(400).json({ error: 'INVALID_DATA' });
    }

    const noteRep = await getRepository(Note);
    const note = await noteRep.findOne(params.id);
    if (!note) {
      return res.status(404).json({ error: 'INVALID_DATA' });
    }

    const user = req.decoded;
    if (note.userId !== user.id) {
      return res.status(400).json({ error: 'INVALID_DATA' });
    }

    try {
      await noteRep.delete(note.id);
      return res.status(200).json({ message: 'SUCCESS' });
    } catch (e) {
      return res.status(400).json({ error: 'INVALID_DATA' });
    }
  }
}

export default NoteController;
