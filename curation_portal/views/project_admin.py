import csv

from django.contrib.auth.mixins import LoginRequiredMixin
from django.db import IntegrityError, transaction
from django.db.models import Count
from django.http import HttpResponse
from django.views import View
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.serializers import ModelSerializer
from rest_framework.views import APIView

from curation_portal.models import CurationAssignment, CurationResult, Project
from curation_portal.serializers import VariantSerializer


class ProjectSerializer(ModelSerializer):
    class Meta:
        model = Project
        fields = ("id", "name")


class ProjectAdminView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        project_id = kwargs["project_id"]
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            raise NotFound("Project does not exist")
        else:
            if not project.owners.filter(id=request.user.id).exists():
                raise PermissionDenied("You do not have permission to view this page")

            total_assignments_by_curator = dict(
                CurationAssignment.objects.filter(variant__project=project)
                .values_list("curator__username")
                .annotate(num_assignments=Count("variant"))
                .all()
            )
            completed_assignments_by_curator = dict(
                CurationAssignment.objects.filter(
                    variant__project=project, result__verdict__isnull=False
                )
                .values_list("curator__username")
                .annotate(num_assignments=Count("variant"))
                .all()
            )

            assignments = {
                curator: {
                    "total": num_assignments,
                    "completed": completed_assignments_by_curator.get(curator, 0),
                }
                for curator, num_assignments in total_assignments_by_curator.items()
            }

            total_variants = project.variants.count()
            num_curated_variants = (
                CurationAssignment.objects.filter(
                    variant__project=project, result__verdict__isnull=False
                )
                .values("variant__variant_id")
                .distinct()
                .count()
            )

            variants = {"total": total_variants, "curated": num_curated_variants}

            return Response(
                dict(
                    project=ProjectSerializer(project).data,
                    assignments=assignments,
                    variants=variants,
                )
            )


class CreateProjectView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        serializer = ProjectSerializer(data=request.data)
        if not serializer.is_valid():
            raise ValidationError(serializer.errors)

        project = serializer.save()
        project.owners.set([request.user])
        return Response(serializer.data)


class ProjectVariantsView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        project_id = kwargs["project_id"]
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            raise NotFound("Project does not exist")
        else:
            if not project.owners.filter(id=request.user.id).exists():
                raise PermissionDenied("You do not have permission to view this page")

            serializer = VariantSerializer(data=request.data, many=True)
            if not serializer.is_valid():
                raise ValidationError(serializer.errors)

            try:
                with transaction.atomic():
                    serializer.save(project=project)

                return Response({})
            except IntegrityError:
                raise ValidationError("Integrity error")


class DownloadProjectResultsView(LoginRequiredMixin, View):
    def get(self, request, *args, **kwargs):
        project_id = kwargs["project_id"]
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            raise NotFound("Project does not exist")
        else:
            if not project.owners.filter(id=request.user.id).exists():
                raise PermissionDenied("You do not have permission to view this page")

            result_flag_fields = [
                f.name for f in CurationResult._meta.get_fields() if f.name.startswith("flag")
            ]
            result_fields = ["notes", "should_revisit", "verdict"] + result_flag_fields

            completed_assignments = (
                CurationAssignment.objects.filter(
                    variant__project=project, result__verdict__isnull=False
                )
                .select_related("curator", "variant")
                .all()
            )

            response = HttpResponse(content_type="text/csv")
            response["Content-Disposition"] = f'attachment; filename="{project.name}_results.csv"'

            writer = csv.writer(response)

            header_row = ["Variant ID", "Curator"] + [
                " ".join(word.capitalize() for word in f.split("_")) for f in result_fields
            ]
            writer.writerow(header_row)

            for assignment in completed_assignments:
                row = [assignment.variant.variant_id, assignment.curator.username] + [
                    getattr(assignment.result, f) for f in result_fields
                ]
                writer.writerow(row)

            return response
