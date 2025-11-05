-- Add sample rooms for testing
-- This migration adds some sample rooms to test the room selection and timeline functionality

INSERT INTO public.rooms (name, capacity, location, floor, equipment, description, is_active) VALUES
('Conference Room A', 8, 'Main Building', '1st Floor', ARRAY['Projector', 'Whiteboard', 'Video Conference'], 'Large conference room with modern amenities', true),
('Meeting Room B', 4, 'Main Building', '1st Floor', ARRAY['TV Screen', 'Whiteboard'], 'Small meeting room perfect for team discussions', true),
('Boardroom', 12, 'Main Building', '2nd Floor', ARRAY['Projector', 'Video Conference', 'Sound System'], 'Executive boardroom for important meetings', true),
('Training Room', 20, 'Training Center', '1st Floor', ARRAY['Projector', 'Microphone', 'Flipchart'], 'Large training room for workshops and seminars', true),
('Huddle Space 1', 2, 'Main Building', '1st Floor', ARRAY['TV Screen'], 'Quick huddle space for brief discussions', true),
('Innovation Lab', 6, 'Innovation Wing', '2nd Floor', ARRAY['Whiteboard', 'Flipchart', 'TV Screen'], 'Creative space for brainstorming sessions', true)
ON CONFLICT DO NOTHING;

-- Add some sample bookings for today to test timeline functionality
INSERT INTO public.bookings (room_id, user_id, title, description, start_time, end_time, status) 
SELECT 
    r.id,
    u.id,
    'Sample Meeting',
    'This is a sample booking for testing',
    CURRENT_DATE + INTERVAL '10 hours',
    CURRENT_DATE + INTERVAL '11 hours',
    'confirmed'
FROM public.rooms r
CROSS JOIN public.users u
WHERE r.name = 'Conference Room A'
AND u.role = 'admin'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO public.bookings (room_id, user_id, title, description, start_time, end_time, status) 
SELECT 
    r.id,
    u.id,
    'Team Standup',
    'Daily team standup meeting',
    CURRENT_DATE + INTERVAL '14 hours',
    CURRENT_DATE + INTERVAL '15 hours',
    'confirmed'
FROM public.rooms r
CROSS JOIN public.users u
WHERE r.name = 'Meeting Room B'
AND u.role = 'admin'
LIMIT 1
ON CONFLICT DO NOTHING;