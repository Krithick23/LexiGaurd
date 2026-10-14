import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Normalizes user role string to one of the 4 canonical roles:
 * - 'freelancer' (Freelancer / Independent Contractor)
 * - 'employee' (Intern / Full-Time Employee)
 * - 'small_business' (Small Business Owner / Vendor / SMB)
 * - 'founder' (Startup Founder / Co-Founder / Equity Holder)
 */
export const normalizeRole = (role) => {
  if (!role || typeof role !== 'string') return 'freelancer';
  const r = role.toLowerCase().trim();
  if (r.includes('intern') || r.includes('employee') || r === 'intern_employee') {
    return 'employee';
  }
  if (
    r.includes('business') ||
    r.includes('vendor') ||
    r.includes('smb') ||
    r.includes('supplier') ||
    r === 'small_business' ||
    r === 'agency'
  ) {
    return 'small_business';
  }
  if (r.includes('founder') || r.includes('startup') || r === 'startup_founder') {
    return 'founder';
  }
  if (r.includes('free') || r.includes('contractor') || r.includes('consultant')) {
    return 'freelancer';
  }
  return 'freelancer';
};

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ['freelancer', 'employee', 'small_business', 'founder'],
        message: '{VALUE} is not a supported role',
      },
      default: 'freelancer',
      set: (val) => normalizeRole(val),
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        return ret;
      },
    },
  }
);

// Pre-save hook to hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model('User', userSchema);
export default User;
