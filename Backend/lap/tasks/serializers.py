from rest_framework import serializers
from accounts.models import User
from .models import Task, TaskActivity, TaskComment, TaskNotification


def user_payload(user):
    if not user:
        return None
    name = user.get_full_name() or user.username
    return {
        'id': str(user.id),
        'name': name,
        'full_name': name,
        'email': user.email,
        'role': user.get_display_role() if hasattr(user, 'get_display_role') else user.role,
        'base_role': user.role,
        'avatar': f'https://ui-avatars.com/api/?name={name}&background=6366f1&color=fff',
    }


class TaskUserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'role']

    def get_name(self, obj):
        return obj.get_full_name() or obj.username


class TaskCommentSerializer(serializers.ModelSerializer):
    author = serializers.SerializerMethodField()
    timestamp = serializers.SerializerMethodField()

    class Meta:
        model = TaskComment
        fields = ['id', 'author', 'content', 'timestamp', 'created_at']

    def get_author(self, obj):
        return user_payload(obj.author)

    def get_timestamp(self, obj):
        return obj.created_at.strftime('%d/%m/%Y %I:%M %p')


class TaskActivitySerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    timestamp = serializers.SerializerMethodField()

    class Meta:
        model = TaskActivity
        fields = ['id', 'user', 'action', 'details', 'timestamp', 'created_at']

    def get_user(self, obj):
        return obj.user.get_full_name() or obj.user.username if obj.user else 'System'

    def get_timestamp(self, obj):
        return obj.created_at.strftime('%d/%m/%Y %I:%M %p')


class TaskSerializer(serializers.ModelSerializer):
    assignedTo = serializers.SerializerMethodField()
    assignedBy = serializers.SerializerMethodField()
    comments = TaskCommentSerializer(many=True, read_only=True)
    history = TaskActivitySerializer(many=True, read_only=True)
    createdDate = serializers.SerializerMethodField()
    startDate = serializers.DateField(source='start_date', required=False, allow_null=True)
    dueDate = serializers.DateField(source='due_date', required=False, allow_null=True)
    relatedModule = serializers.CharField(source='related_module', required=False, allow_blank=True)
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        source='assigned_to',
        queryset=User.objects.filter(is_active=True),
        required=False,
        allow_null=True,
        write_only=True,
    )

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'status', 'priority',
            'startDate', 'dueDate', 'assignedTo', 'assignedBy', 'assigned_to_id',
            'tags', 'attachments', 'relatedModule', 'archived',
            'comments', 'history', 'createdDate', 'created_at', 'updated_at',
        ]
        read_only_fields = ['assignedBy', 'created_at', 'updated_at']

    def get_assignedTo(self, obj):
        return user_payload(obj.assigned_to)

    def get_assignedBy(self, obj):
        return user_payload(obj.assigned_by)

    def get_createdDate(self, obj):
        return obj.created_at.date().isoformat()


class TaskNotificationSerializer(serializers.ModelSerializer):
    taskId = serializers.SerializerMethodField()
    taskTitle = serializers.SerializerMethodField()
    sender = serializers.SerializerMethodField()
    timestamp = serializers.SerializerMethodField()

    class Meta:
        model = TaskNotification
        fields = ['id', 'type', 'taskId', 'taskTitle', 'sender', 'message', 'read', 'timestamp', 'created_at']

    def get_taskId(self, obj):
        return obj.task_id

    def get_taskTitle(self, obj):
        return obj.task.title if obj.task else ''

    def get_sender(self, obj):
        return obj.sender.get_full_name() or obj.sender.username if obj.sender else 'System'

    def get_timestamp(self, obj):
        return obj.created_at.strftime('%d/%m/%Y %I:%M %p')
