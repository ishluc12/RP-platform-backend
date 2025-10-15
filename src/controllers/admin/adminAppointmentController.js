const Appointment = require('../../models/Appointment');
const User = require('../../models/User');
const { supabase } = require('../../config/database');

// Get all appointments (admin can see ALL appointments in system)
exports.getAllAppointments = async (req, res) => {
  try {
    console.log('Admin appointments request:', { query: req.query, user: req.user?.id });
    const { q, status, date, page = 1, limit = 10, lecturer, student } = req.query;

    // Build filters for Supabase
    let filters = {};
    if (status) {
      filters.status = status;
    }
    if (date) {
      // Apply date filter for the entire day
      filters.appointment_time_from = `${date}T00:00:00Z`;
      filters.appointment_time_to = `${date}T23:59:59Z`;
    }

    // Note on Improvement: The filters 'lecturer', 'student', and 'q' should ideally be passed 
    // to Appointment.findAll to filter in the database, not in memory after pagination.

    // Get appointments using the model's findAll method
    console.log('Fetching appointments with filters:', filters);
    const result = await Appointment.findAll(parseInt(page), parseInt(limit), filters);
    console.log('Appointment query result:', { success: result.success, dataLength: result.data?.length, error: result.error });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch appointments',
        error: result.error
      });
    }

    let appointments = result.data;

    // Get all unique user IDs from appointments
    const userIds = [...new Set([
      ...appointments.map(apt => apt.requester_id),
      ...appointments.map(apt => apt.appointee_id)
    ].filter(Boolean))];

    // Fetch user details
    let usersMap = {};
    if (userIds.length > 0) {
      try {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('id, name, role, email')
          .in('id', userIds);

        if (usersError) {
          console.error('Error fetching users:', usersError);
        } else if (users) {
          usersMap = users.reduce((acc, user) => {
            acc[user.id] = {
              name: user.name || user.email || 'Unknown User',
              role: user.role
            };
            return acc;
          }, {});
        }
      } catch (userFetchError) {
        console.error('Exception fetching users:', userFetchError);
        // Continue with empty usersMap
      }
    }

    // Transform for frontend with actual user names
    let transformedAppointments = appointments.map(apt => {
      const requester = usersMap[apt.requester_id] || { name: 'Unknown User', role: 'unknown' };
      const appointee = usersMap[apt.appointee_id] || { name: 'Unknown User', role: 'unknown' };

      // Determine which is lecturer and which is student based on roles
      let lecturer_name = 'Unknown';
      let student_name = 'Unknown';

      if (requester.role === 'lecturer' || requester.role === 'staff') {
        lecturer_name = requester.name;
        student_name = appointee.name;
      } else if (appointee.role === 'lecturer' || appointee.role === 'staff') {
        lecturer_name = appointee.name;
        student_name = requester.name;
      } else {
        // Fallback: assume requester is student, appointee is lecturer
        student_name = requester.name;
        lecturer_name = appointee.name;
      }

      return {
        id: apt.id,
        _id: apt.id,
        lecturer_name,
        student_name,
        // Split appointment_time (ISO string) for display
        date: apt.appointment_time?.split('T')[0] || apt.appointment_time,
        time: apt.appointment_time?.split('T')[1]?.split('.')[0] || '',
        appointment_time: apt.appointment_time,
        status: apt.status,
        reason: apt.reason,
        location: apt.location,
        meeting_type: apt.meeting_type,
        meeting_link: apt.meeting_link,
        duration_minutes: apt.duration_minutes,
        notes: apt.notes,
        priority: apt.priority,
        appointment_type: apt.appointment_type,
        requester_id: apt.requester_id,
        appointee_id: apt.appointee_id,
        created_at: apt.created_at,
        updated_at: apt.updated_at
      };
    });

    // Apply in-memory frontend filters (applied to the current page only)
    if (lecturer) {
      transformedAppointments = transformedAppointments.filter(apt =>
        apt.lecturer_name.toLowerCase().includes(lecturer.toLowerCase())
      );
    }
    if (student) {
      transformedAppointments = transformedAppointments.filter(apt =>
        apt.student_name.toLowerCase().includes(student.toLowerCase())
      );
    }
    if (q) {
      transformedAppointments = transformedAppointments.filter(apt =>
        apt.lecturer_name.toLowerCase().includes(q.toLowerCase()) ||
        apt.student_name.toLowerCase().includes(q.toLowerCase()) ||
        apt.reason?.toLowerCase().includes(q.toLowerCase())
      );
    }

    res.json({
      success: true,
      data: transformedAppointments,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching admin appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: error.message
    });
  }
};

// Get appointment by ID
exports.getAppointmentById = async (req, res) => {
  try {
    const result = await Appointment.findById(req.params.id);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment',
      error: error.message
    });
  }
};

// Update appointment status
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    // CRITICAL FIX: The validStatuses list must strictly match the database's 
    // appointment_status enum: 'pending', 'accepted', 'declined', 'completed', 'cancelled', 'rescheduled'.
    const validStatuses = ['pending', 'accepted', 'declined', 'completed', 'cancelled', 'rescheduled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status value. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // NOTE: Admin has system-wide update permission, so no 'appointee_id' check is needed here, 
    // unlike the staff controller.
    const result = await Appointment.update(id, { status });

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found or update failed',
        error: result.error
      });
    }

    res.json({
      success: true,
      message: 'Appointment status updated successfully',
      data: result.data
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment status',
      error: error.message
    });
  }
};

// Delete appointment
exports.deleteAppointment = async (req, res) => {
  try {
    // NOTE: Direct Supabase call bypasses the Appointment model (acceptable for admin delete)
    const { data, error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', req.params.id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete appointment',
      error: error.message
    });
  }
};

// Get appointment statistics
exports.getAppointmentStats = async (req, res) => {
  try {
    // Get total count
    const { count: total, error: countError } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true });

    if (countError) throw countError;

    // Get stats by status
    const { data: statusStats, error: statsError } = await supabase
      .from('appointments')
      .select('status');

    if (statsError) throw statsError;

    // Count by status
    const byStatus = statusStats.reduce((acc, appt) => {
      acc[appt.status] = (acc[appt.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        total,
        byStatus
      }
    });
  } catch (error) {
    console.error('Error fetching appointment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment statistics',
      error: error.message
    });
  }
};

// Search appointments (additional search endpoint if needed)
exports.searchAppointments = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query required'
      });
    }

    // Simple search in reason field for now
    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .ilike('reason', `%${q}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: appointments
    });
  } catch (error) {
    console.error('Error searching appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search appointments',
      error: error.message
    });
  }
};