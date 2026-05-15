const prisma = require('../prisma');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const normalizePhone = (phone) => {
    if (typeof phone !== 'string') return '';
    const trimmed = phone.trim();
    if (!trimmed) return '';
    const hasPlus = trimmed.startsWith('+');
    const digits = trimmed.replace(/\D/g, '');
    return hasPlus ? `+${digits}` : digits;
};

const normalizeUsername = (username) => {
    if (typeof username !== 'string') return '';
    return username.trim().toLowerCase();
};

const register = async (req, res) => {
    const { phone, password } = req.body;
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedPhone || !password) {
        return res.status(400).json({ error: 'Phone number and password are required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                phone: normalizedPhone,
                password: hashedPassword,
            },
        });
        res.status(201).json({ message: 'User created successfully', userId: user.id });
    } catch (error) {
        res.status(400).json({ error: 'User with this phone number already exists or invalid data' });
    }
};

const login = async (req, res) => {
    const { phone, password } = req.body;
    const identifier = typeof phone === 'string' ? phone.trim() : '';
    const isUsernameLogin = /[a-zа-яіїєґ]/i.test(identifier);
    const normalizedPhone = normalizePhone(identifier);
    const normalizedUsername = normalizeUsername(identifier);

    if ((!normalizedPhone && !normalizedUsername) || !password) {
        return res.status(400).json({ error: 'Login and password are required' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: isUsernameLogin
                ? { username: normalizedUsername }
                : { phone: normalizedPhone },
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid login or password' });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                phone: user.phone,
                username: user.username,
                role: user.role,
            },
        });
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true,
                phone: true,
                username: true,
                role: true,
                createdAt: true,
                appointments: {
                    include: {
                        store: true,
                    },
                },
            },
        });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

module.exports = { register, login, getProfile };
