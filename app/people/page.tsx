"use client"

import { useState, useTransition } from "react"
import { Pencil, Plus, Trash2, Users } from "lucide-react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  createPerson,
  updatePerson,
  deletePerson,
} from "@/lib/actions/persons"
import type { Person } from "@/lib/types"
import { toast } from "sonner"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function PeoplePage() {
  const { data, mutate } = useSWR<Person[]>("/api/persons", fetcher, {
    revalidateOnFocus: true,
  })
  const persons = data || []

  const [formOpen, setFormOpen] = useState(false)
  const [editPerson, setEditPerson] = useState<Person | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null)
  const [name, setName] = useState("")
  const [nameError, setNameError] = useState("")
  const [isPending, startTransition] = useTransition()

  function openCreate() {
    setEditPerson(null)
    setName("")
    setNameError("")
    setFormOpen(true)
  }

  function openEdit(person: Person) {
    setEditPerson(person)
    setName(person.name)
    setNameError("")
    setFormOpen(true)
  }

  function handleSubmit() {
    if (!name.trim()) {
      setNameError("El nombre es obligatorio")
      return
    }

    startTransition(async () => {
      const result = editPerson
        ? await updatePerson(editPerson.id, { name: name.trim() })
        : await createPerson({ name: name.trim() })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(
          editPerson ? "Persona actualizada" : "Persona creada"
        )
        setFormOpen(false)
        mutate()
      }
    })
  }

  function handleDelete() {
    if (!deleteTarget) return

    startTransition(async () => {
      const result = await deletePerson(deleteTarget.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success("Persona eliminada")
        mutate()
      }
      setDeleteTarget(null)
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Personas</h1>
              <p className="text-sm text-muted-foreground">
                Administra las personas o categorias de gasto
              </p>
            </div>
            <Button onClick={openCreate} className="gap-1.5">
              <Plus className="size-4" />
              Nueva persona
            </Button>
          </div>

          {persons.length === 0 ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users />
                </EmptyMedia>
                <EmptyTitle>Sin personas</EmptyTitle>
                <EmptyDescription>
                  Crea una persona o categoria para poder asignar gastos.
                </EmptyDescription>
              </EmptyHeader>
              <Button onClick={openCreate} className="gap-1.5">
                <Plus className="size-4" />
                Crear primera persona
              </Button>
            </Empty>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Lista de personas</CardTitle>
                <CardDescription>
                  {persons.length} persona{persons.length !== 1 ? "s" : ""}{" "}
                  registrada{persons.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {persons.map((person) => (
                      <TableRow key={person.id}>
                        <TableCell className="font-medium">
                          {person.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7"
                              onClick={() => openEdit(person)}
                              aria-label={`Editar ${person.name}`}
                            >
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(person)}
                              aria-label={`Eliminar ${person.name}`}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editPerson ? "Editar persona" : "Nueva persona"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="person-name">Nombre</Label>
              <Input
                id="person-name"
                placeholder="Ej: Sabrina"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setNameError("")
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                aria-invalid={!!nameError}
                autoFocus
              />
              {nameError && (
                <p className="text-xs text-destructive">{nameError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFormOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending
                ? "Guardando..."
                : editPerson
                  ? "Guardar"
                  : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Eliminar &quot;{deleteTarget?.name}&quot;
            </AlertDialogTitle>
            <AlertDialogDescription>
              Si esta persona tiene gastos asociados, no podra ser eliminada.
              Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
