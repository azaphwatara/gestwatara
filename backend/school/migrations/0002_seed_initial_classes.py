from django.db import migrations


INITIAL_CLASSES = ["SIL", "CP", "CE1", "CE2", "CM1", "CM2"]


def create_initial_classes(apps, schema_editor):
    school_class = apps.get_model("school", "SchoolClass")
    school_class.objects.using(schema_editor.connection.alias).bulk_create(
        [school_class(name=name) for name in INITIAL_CLASSES],
        ignore_conflicts=True,
    )


class Migration(migrations.Migration):
    dependencies = [
        ("school", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_initial_classes, migrations.RunPython.noop),
    ]
