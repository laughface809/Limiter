import { Request, Response, NextFunction } from 'express'
import IORedis from 'ioredis'
import ip from 'request-ip'

export async function rateLimiterById(req: Request, res: Response, next: NextFunction): Promise<any> {
	// setup redis
	const io = new IORedis({
		host: process.env.REDIS_HOST || 'localhost',
		port: parseInt(process.env.REDIS_PORT || ''),
		db: 1
	})
	// store id to redis
	await io.set(`redis-id:${req.payload.uid}`, req.payload.uid)
	// get request by id
	const getId = await io.get(`redis-id:${req.payload.uid}`)
	// counter count request
	const maxCounterRequest = await io.incrby(`counter-id:${req.payload.uid}`, 1)

	if (getId === req.payload.uid && maxCounterRequest <= 50) {
		await io.expire(`counter-id:${req.payload.uid}`, 10)
	} else {
		await io.del(`redis-id:${req.payload.uid}`)
		return res.status(429).json({
			status: 'ERROR TO MANY REQUEST',
			code: 'AX2AC5R',
			message: 'cannot access this endpoint, after 10 second is over'
		})
	}

	next()
}

export async function rateLimiterByIp(req: Request, res: Response, next: NextFunction): Promise<any> {
	// setup redis
	const io = new IORedis({
		host: process.env.REDIS_HOST || 'localhost',
		port: parseInt(process.env.REDIS_PORT || ''),
		db: 2
	})
	const getIp = ip.getClientIp(req)
	// store id to redis
	await io.set(`redis-ip:${getIp}`, `${getIp}`)
	// get request by id
	const getStoreIp = await io.get(`redis-ip:${getIp}`)
	// counter count request
	const maxCounterRequest = await io.incrby(`counter-ip:${getIp}`, 1)

	if (getStoreIp === getIp && maxCounterRequest <= 50) {
		await io.expire(`counter-ip:${getIp}`, 10)
	} else {
		await io.del(`redis-ip:${getIp}`)
		return res.status(429).json({
			status: 'ERROR TO MANY REQUEST',
			code: 'AX2AC5R',
			message: 'cannot access this endpoint, after 10 second is over'
		})
	}

	next()
}
