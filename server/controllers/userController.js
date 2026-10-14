import User, { normalizeRole } from '../models/User.js';
import Contract from '../models/Contract.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * @desc    Get user profile
 * @route   GET /api/user/profile
 * @access  Private
 */
export const getProfile = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user._id).select('-password');
  res.status(200).json({
    success: true,
    user,
  });
});

/**
 * @desc    Update user profile (name, role)
 * @route   PUT /api/user/profile
 * @access  Private
 */
export const updateProfile = asyncHandler(async (req, res, next) => {
  const { name, role } = req.body;
  const updates = {};

  if (name) updates.name = name.trim();
  if (role) {
    updates.role = normalizeRole(role);
  }

  const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  }).select('-password');

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    user: updatedUser,
  });
});

/**
 * @desc    Change user password
 * @route   PUT /api/user/password
 * @access  Private
 */
export const changePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found.',
    });
  }

  // Check current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: 'Current password provided is incorrect.',
    });
  }

  // Update password (pre-save hook will hash it)
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully.',
  });
});

/**
 * @desc    Delete user account and cascade delete all associated contracts
 * @route   DELETE /api/user/account
 * @access  Private
 */
export const deleteAccount = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;

  // 1. Delete all contracts belonging to this user
  const deletedContractsResult = await Contract.deleteMany({ userId });

  // 2. Delete user record
  await User.findByIdAndDelete(userId);

  // 3. Clear auth cookie
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
  });

  res.status(200).json({
    success: true,
    message: `Account and ${deletedContractsResult.deletedCount} associated contract record(s) deleted permanently.`,
  });
});
